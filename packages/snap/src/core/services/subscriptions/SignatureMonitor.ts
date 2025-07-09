import { signature as asSignature } from '@solana/kit';

import type { Commitment } from '../../../entities';
import type { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import type { SubscriptionService } from './SubscriptionService';

type Params = {
  signature: string;
  commitment: Commitment;
  network: Network;
  onCommitmentReached: (params: Params) => Promise<void>;
};

export class SignatureMonitor {
  readonly #subscriptionService: SubscriptionService;

  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  readonly #loggerPrefix = '[✍️ SignatureMonitor]';

  constructor(
    subscriptionService: SubscriptionService,
    connection: SolanaConnection,
    logger: ILogger,
  ) {
    this.#subscriptionService = subscriptionService;
    this.#connection = connection;
    this.#logger = logger;
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
   * @param params - The parameters for the signature watcher.
   */
  async monitor(params: Params): Promise<void> {
    this.#logger.info(this.#loggerPrefix, `Monitoring signature`, params);

    const { network, signature, commitment } = params;

    await this.#subscriptionService.subscribe(
      {
        method: 'signatureSubscribe',
        unsubscribeMethod: 'signatureUnsubscribe',
        network,
        params: [
          signature,
          {
            commitment,
            enableReceivedNotification: false,
          },
        ],
      },
      {
        onNotification: async (message: any) => {
          // The notification message isn't useful. If we get here, we know the signature has reached the desired commitment.
          await this.#handleNotification(params);
        },
        onConnectionRecovery: async () => {
          await this.#handleConnectionRecovery(params);
        },
      },
    );
  }

  async #handleNotification(params: Params): Promise<void> {
    const { signature, commitment, onCommitmentReached } = params;

    /**
     * We don't need need to compare the commitment with the confirmation status.
     * By design of the RPC API, if we receive a notification, then it means
     * that the transaction has reached the desired commitment.
     */

    this.#logger.info(
      this.#loggerPrefix,
      `🎉 Signature ${signature} reached commitment "${commitment}"`,
    );

    try {
      await onCommitmentReached(params);
    } catch (error) {
      this.#logger.warn(
        this.#loggerPrefix,
        `⚠️ Error calling onCommitmentReached callback`,
        error,
      );
    }

    /**
     * As per the RPC API, we don't need to unsubscribe from the subscription.
     * It will be automatically unsubscribed when the transaction reaches the
     * desired commitment.
     *
     * @see https://solana.com/fr/docs/rpc/websocket/signaturesubscribe
     */
  }

  async #handleConnectionRecovery(params: Params): Promise<void> {
    const { signature, network } = params;

    // Fetch the transaction from the RPC API
    const confirmationStatus = await this.#fetchConfirmationStatus(
      signature,
      network,
    );

    if (confirmationStatus) {
      await this.#handleNotification(params);
    } else {
      this.#logger.warn(
        this.#loggerPrefix,
        `⚠️ Signature ${signature} not found via HTTP fetch during connection recovery`,
      );
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
          this.#loggerPrefix,
          `✅ Signature ${signature} found via HTTP fetch during connection recovery with confirmation status ${confirmationStatus}`,
        );
        return confirmationStatus;
      }

      this.#logger.warn(
        this.#loggerPrefix,
        `⚠️ Signature ${signature} not found via HTTP fetch during connection recovery`,
      );
      return undefined;
    } catch (error) {
      this.#logger.warn(
        this.#loggerPrefix,
        `⚠️ Could not fetch confirmation status for signature ${signature}`,
        error,
      );
      return undefined;
    }
  }
}
