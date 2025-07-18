import { assert, string } from '@metamask/superstruct';
import { signature as asSignature } from '@solana/kit';
import { get } from 'lodash';

import type {
  Commitment,
  SignatureNotification,
  Subscription,
} from '../../../entities';
import type { Network } from '../../constants/solana';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { AccountService } from '../accounts/AccountService';
import type { AnalyticsService } from '../analytics/AnalyticsService';
import type { ConfigProvider } from '../config';
import type { SolanaConnection } from '../connection';
import type { TransactionsService } from '../transactions/TransactionsService';
import type { SubscriptionService } from './SubscriptionService';

export class SignatureMonitor {
  readonly #subscriptionService: SubscriptionService;

  readonly #accountService: AccountService;

  readonly #transactionsService: TransactionsService;

  readonly #analyticsService: AnalyticsService;

  readonly #connection: SolanaConnection;

  readonly #configProvider: ConfigProvider;

  readonly #logger: ILogger;

  constructor(
    subscriptionService: SubscriptionService,
    accountService: AccountService,
    transactionsService: TransactionsService,
    analyticsService: AnalyticsService,
    connection: SolanaConnection,
    configProvider: ConfigProvider,
    logger: ILogger,
  ) {
    this.#subscriptionService = subscriptionService;
    this.#accountService = accountService;
    this.#transactionsService = transactionsService;
    this.#analyticsService = analyticsService;
    this.#connection = connection;
    this.#configProvider = configProvider;
    this.#logger = createPrefixedLogger(logger, '[✍️ SignatureMonitor]');

    this.#bindHandlers();
  }

  #bindHandlers(): void {
    const { activeNetworks } = this.#configProvider.get();

    activeNetworks.forEach((network) => {
      this.#subscriptionService.registerNotificationHandler(
        'signatureSubscribe',
        network,
        this.#handleSignatureNotification.bind(this),
      );
    });
  }

  /**
   * Monitors a signature for a given network, and executes the passed callback
   * when the transaction with the given signature reaches the specified
   * commitment level.
   *
   * It subscribes to the RPC WebSocket API, to receive a notification
   * when the transaction with the given signature reaches the specified
   * commitment level.
   *
   * When it does, it unsubscribes from the RPC WebSocket API, and executes the
   * given callback.
   *
   * It recovers from any missed notifications by directly fetching the
   * confirmation status of the signature from the RPC HTTP API.
   *
   * @see https://solana.com/docs/rpc/websocket/signaturesubscribe
   * @param signature - The signature to monitor.
   * @param accountId - The account ID to monitor.
   * @param commitment - The commitment level to monitor.
   * @param network - The network to monitor.
   * @param origin - The origin of the transaction.
   */
  async monitor(
    signature: string,
    accountId: string,
    commitment: Commitment,
    network: Network,
    origin: string,
  ): Promise<void> {
    this.#logger.info(`Monitoring signature`, {
      signature,
      accountId,
      commitment,
      network,
      origin,
    });

    await this.#subscriptionService.subscribe({
      method: 'signatureSubscribe',
      network,
      params: [
        signature,
        {
          commitment,
          enableReceivedNotification: false,
        },
      ],
      metadata: {
        accountId,
        origin,
      },
    });

    this.#subscriptionService.registerConnectionRecoveryHandler(
      network,
      async () =>
        this.#handleConnectionRecovery(
          signature,
          accountId,
          commitment,
          network,
          origin,
        ),
    );
  }

  async #handleSignatureNotification(
    _notification: SignatureNotification,
    subscription: Subscription,
  ): Promise<void> {
    /**
     * We don't need need to compare the commitment with the confirmation status.
     * By design of the RPC API, if we receive a notification, then it means
     * that the transaction has reached the desired commitment.
     */

    const { network } = subscription;

    const signature = get(subscription, 'params[0]');
    assert(signature, string());

    const commitment = get(subscription, 'params[1].commitment');
    assert(commitment, string());

    const accountId = subscription.metadata?.accountId;
    assert(accountId, string());

    const origin = subscription.metadata?.origin;
    assert(origin, string());

    switch (commitment) {
      case 'confirmed':
        await this.#handleConfirmed(signature, accountId, origin, network);
        break;
      default:
        this.#logger.warn(`⚠️ Commitment ${commitment} not supported`);
    }

    await this.#subscriptionService.unsubscribe(subscription.id);
  }

  async #handleConfirmed(
    signature: string,
    accountId: string,
    origin: string,
    network: Network,
  ): Promise<void> {
    this.#logger.info('Handling transaction confirmed', {
      signature,
      accountId,
      network,
      origin,
    });

    const account = await this.#accountService.findById(accountId);
    if (!account) {
      this.#logger.warn('Account not found', accountId);
      return;
    }

    const transaction = await this.#transactionsService.fetchBySignature(
      signature,
      account,
      network,
    );

    if (!transaction) {
      throw new Error(
        `Transaction with signature ${signature} not found on network ${network}`,
      );
    }

    await this.#transactionsService.saveTransaction(transaction, account);

    // Track in analytics
    await this.#analyticsService.trackEventTransactionFinalized(
      account,
      transaction,
      {
        scope: network,
        origin,
      },
    );
  }

  async #handleConnectionRecovery(
    signature: string,
    accountId: string,
    commitment: Commitment,
    network: Network,
    origin: string,
  ): Promise<void> {
    this.#logger.info('Handling connection recovery', {
      network,
      signature,
      commitment,
      origin,
    });

    const confirmationStatus = await this.#fetchConfirmationStatus(
      signature,
      network,
    );

    switch (confirmationStatus) {
      case 'confirmed':
        await this.#handleConfirmed(signature, accountId, origin, network);
        break;
      default:
        this.#logger.warn(`⚠️ Commitment ${commitment} not supported`);
    }
  }

  /**
   * Fetches the status of a signature from the RPC API.
   * @see https://docs.solana.com/developing/clients/jsonrpc-api#gettransaction
   * @param signature - The signature to fetch the status of.
   * @param network - The network to fetch the status from.
   * @returns The status of the signature.
   */
  async #fetchConfirmationStatus(
    signature: string,
    network: Network,
  ): Promise<Commitment | undefined> {
    try {
      const confirmationStatuses = await this.#connection
        .getRpc(network)
        .getSignatureStatuses([asSignature(signature)], {
          searchTransactionHistory: true,
        })
        .send();

      const confirmationStatus =
        confirmationStatuses.value[0]?.confirmationStatus;

      if (confirmationStatus) {
        this.#logger.info(
          `✅ Signature ${signature} found via HTTP fetch during connection recovery with confirmation status ${confirmationStatus}`,
        );
        return confirmationStatus;
      }

      this.#logger.warn(
        `⚠️ Signature ${signature} not found via HTTP fetch during connection recovery`,
      );
      return undefined;
    } catch (error) {
      this.#logger.warn(
        `⚠️ Could not fetch confirmation status for signature ${signature}`,
        error,
      );
      return undefined;
    }
  }
}
