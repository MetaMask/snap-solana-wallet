import { signature as asSignature } from '@solana/kit';

import type { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import type { SubscriptionService } from './SubscriptionService';

type Commitment = 'processed' | 'confirmed' | 'finalized';

type Params = {
  signature: string;
  commitment: Commitment;
  network: Network;
  onCommitmentReached: (params: Params) => Promise<void>;
};

export class SignatureWatcher {
  readonly #subscriptionService: SubscriptionService;

  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  readonly #loggerPrefix = '[✍️ SignatureWatcher]';

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
   * Watches a signature for a given network, and executes the passed callback
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
   * @returns The subscription ID.
   */
  async watch(params: Params): Promise<void> {
    this.#logger.info(this.#loggerPrefix, `Watching signature`, params);

    const { network, signature, commitment } = params;

    const subscriptionId = await this.#subscriptionService.subscribe(
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
          await this.#handleNotification(params, subscriptionId);
        },
        onConnectionRecovery: async () => {
          await this.#handleConnectionRecovery(params, subscriptionId);
        },
      },
    );
  }

  async #handleNotification(
    params: Params,
    subscriptionId: string,
  ): Promise<void> {
    const { signature, commitment, onCommitmentReached } = params;

    this.#logger.info(
      this.#loggerPrefix,
      `🎉 Signature ${signature} reached commitment "${commitment}"`,
    );

    await Promise.allSettled([
      this.#subscriptionService.unsubscribe(subscriptionId),
      onCommitmentReached(params),
    ]);
  }

  async #handleConnectionRecovery(
    params: Params,
    subscriptionId: string,
  ): Promise<void> {
    const { signature, network } = params;

    // Fetch the transaction from the RPC API
    const confirmationStatus = await this.#fetchConfirmationStatus(
      signature,
      network,
    );

    if (confirmationStatus) {
      await this.#handleNotification(params, subscriptionId);
    } else {
      this.#logger.warn(
        this.#loggerPrefix,
        `⚠️ Signature ${signature} not found via HTTP fetch during connection recovery`,
      );
      await this.#subscriptionService.unsubscribe(subscriptionId);
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
