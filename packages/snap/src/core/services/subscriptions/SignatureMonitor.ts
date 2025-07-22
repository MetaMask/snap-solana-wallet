import { assert, string } from '@metamask/superstruct';
import { signature as asSignature } from '@solana/kit';
import { get } from 'lodash';

import {
  CommitmentStruct,
  type Commitment,
  type SignatureNotification,
  type Subscription,
  type SubscriptionRequest,
} from '../../../entities';
import type { Network } from '../../constants/solana';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { AccountsService } from '../accounts/AccountsService';
import type { AnalyticsService } from '../analytics/AnalyticsService';
import type { ConfigProvider } from '../config';
import type { SolanaConnection } from '../connection';
import type { TransactionsService } from '../transactions/TransactionsService';
import type { SubscriptionService } from './SubscriptionService';

export class SignatureMonitor {
  readonly #subscriptionService: SubscriptionService;

  readonly #accountService: AccountsService;

  readonly #transactionsService: TransactionsService;

  readonly #analyticsService: AnalyticsService;

  readonly #connection: SolanaConnection;

  readonly #configProvider: ConfigProvider;

  readonly #logger: ILogger;

  readonly #pendingSubscriptions: Map<string, SubscriptionRequest> = new Map(); // subscriptionId -> subscriptionRequest

  constructor(
    subscriptionService: SubscriptionService,
    accountService: AccountsService,
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
      this.#subscriptionService.registerConnectionRecoveryHandler(
        network,
        this.#handleConnectionRecovery.bind(this),
      );
    });
  }

  /**
   * Monitors a user's signature for a given network, and handles side effects
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

    const subscriptionRequest: SubscriptionRequest = {
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
    };

    const subscriptionId =
      await this.#subscriptionService.subscribe(subscriptionRequest);

    this.#pendingSubscriptions.set(subscriptionId, subscriptionRequest);
  }

  async #handleSignatureNotification(
    _notification: SignatureNotification,
    subscription: Subscription,
  ): Promise<void> {
    try {
      /**
       * We don't need need to compare the commitment with the confirmation status.
       * By design of the RPC API, if we receive a notification, then it means
       * that the transaction has reached the desired commitment.
       */

      const { network } = subscription;

      const signature = get(subscription, 'params[0]');
      assert(signature, string());

      const commitment = get(subscription, 'params[1].commitment');
      assert(commitment, CommitmentStruct);

      const accountId = subscription.metadata?.accountId;
      assert(accountId, string());

      const origin = subscription.metadata?.origin;
      assert(origin, string());

      const account = await this.#accountService.findById(accountId);
      if (!account) {
        throw new Error(`Account not found: ${accountId}`);
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

      switch (commitment) {
        case 'processed':
          await this.#transactionsService.saveTransaction(transaction, account);
          await this.#analyticsService.trackEventTransactionSubmitted(
            account,
            signature,
            {
              scope: network,
              origin,
            },
          );

          break;
        case 'confirmed':
        case 'finalized':
          await this.#transactionsService.saveTransaction(transaction, account);
          await this.#analyticsService.trackEventTransactionFinalized(
            account,
            transaction,
            {
              scope: network,
              origin,
            },
          );
          break;
        default:
          this.#logger.warn(`⚠️ Commitment ${commitment} not supported`);
      }
    } catch (error) {
      this.#logger.error('Error handling signature notification', error);
    } finally {
      // Always unsubscribe and clean up, regardless of success or failure
      await this.#subscriptionService.unsubscribe(subscription.id);

      this.#pendingSubscriptions.delete(subscription.id);
    }
  }

  async #handleConnectionRecovery(): Promise<void> {
    this.#logger.info('Handling connection recovery');

    await Promise.all(
      Array.from(this.#pendingSubscriptions.entries()).map(
        async ([subscriptionId, subscriptionRequest]) => {
          await this.#recoverSignatureSubscription(
            subscriptionRequest,
            subscriptionId,
          );
        },
      ),
    );
  }

  async #recoverSignatureSubscription(
    subscriptionRequest: SubscriptionRequest,
    subscriptionId: string,
  ): Promise<void> {
    try {
      const { network } = subscriptionRequest;
      assert(network, string());

      const signature = get(subscriptionRequest, 'params[0]');
      assert(signature, string());

      const commitment = get(subscriptionRequest, 'params[1].commitment');
      assert(commitment, CommitmentStruct);

      const confirmationStatus = await this.#fetchConfirmationStatus(
        signature,
        network,
      );
      if (!confirmationStatus) {
        throw new Error(
          `Signature ${signature} not found via HTTP fetch during connection recovery`,
        );
      }

      if (!this.#hasAtLeastCommitmentLevel(confirmationStatus, commitment)) {
        this.#logger.info(
          'Signature did not reach the desired commitment while connection was down. Skipping.',
        );
        return;
      }

      // If the signature reached the desired commitment, we simulate a notification, so that it's handled.
      const fakeNotification: SignatureNotification = {
        jsonrpc: '2.0',
        method: 'signatureNotification',
        params: {
          subscription: 1,
          result: {
            context: { slot: BigInt(0) },
            // eslint-disable-next-line id-denylist
            value: { err: null },
          },
        },
      };

      const fakeSubscription: Subscription = {
        ...subscriptionRequest,
        id: subscriptionId,
      } as Subscription;

      await this.#handleSignatureNotification(
        fakeNotification,
        fakeSubscription,
      );

      this.#pendingSubscriptions.delete(subscriptionId);
    } catch (error) {
      this.#logger.error('Error handling connection recovery', error);
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
    const confirmationStatuses = await this.#connection
      .getRpc(network)
      .getSignatureStatuses([asSignature(signature)], {
        searchTransactionHistory: true,
      })
      .send();

    const confirmationStatus =
      confirmationStatuses.value[0]?.confirmationStatus;

    if (!confirmationStatus) {
      throw new Error(
        `Signature ${signature} not found via HTTP fetch during connection recovery`,
      );
    }

    return confirmationStatus;
  }

  /**
   * Checks if the commitment level is at least the minimum level,
   * based on the hierarchy of commitment levels `processed < confirmed < finalized`.
   *
   * @param commitment - The commitment level to check.
   * @param minimumLevel - The minimum level to check against.
   * @returns True if the commitment level is at least the minimum level, false otherwise.
   */
  #hasAtLeastCommitmentLevel(
    commitment: Commitment,
    minimumLevel: Commitment,
  ): boolean {
    return (
      minimumLevel === commitment ||
      (minimumLevel === 'processed' &&
        (commitment === 'confirmed' || commitment === 'finalized')) ||
      (minimumLevel === 'confirmed' && commitment === 'finalized')
    );
  }
}
