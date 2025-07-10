import type {
  AccountInfoBase,
  AccountInfoWithJsonData,
  SolanaRpcResponse,
} from '@solana/kit';
import { address as asAddress } from '@solana/kit';

import type { Commitment } from '../../../entities';
import type { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import type { SubscriptionService } from './SubscriptionService';

export type AccountMonitoringParams = {
  address: string;
  commitment: Commitment;
  network: Network;
  onAccountChanged: (
    message: any,
    params: AccountMonitoringParams,
  ) => Promise<void>;
};

type GetAccountInfoApiResponse<TData> = (AccountInfoBase & TData) | null;
export type AccountNotification = SolanaRpcResponse<
  GetAccountInfoApiResponse<AccountInfoWithJsonData>
>;

export class AccountMonitor {
  readonly #subscriptionService: SubscriptionService;

  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  readonly #loggerPrefix = '[👤 AccountMonitor]';

  // Map of address -> network -> subscriptionId
  readonly #subscriptions: Map<string, Map<Network, string>> = new Map();

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
   * Monitors an RPC account for changes on a given network, and executes the passed
   * callback when the account changes.
   *
   * It subscribes to the RPC WebSocket API, to receive a notification
   * when the account changes.
   *
   * It recovers from any missed notifications by directly fetching the
   * account info from the RPC HTTP API.
   *
   * @see https://solana.com/docs/rpc/websocket/accountsubscribe
   * @param params - The parameters for the account monitor.
   * @returns The subscription ID.
   */
  async monitor(params: AccountMonitoringParams): Promise<string> {
    this.#logger.info(this.#loggerPrefix, `Monitoring account`, params);

    const { network, address, commitment } = params;

    const subscriptionId = await this.#subscriptionService.subscribe(
      {
        method: 'accountSubscribe',
        unsubscribeMethod: 'accountUnsubscribe',
        network,
        params: [address, { commitment, encoding: 'jsonParsed' }],
      },
      {
        onNotification: async (notification: AccountNotification) => {
          await this.#handleNotification(notification, params);
        },
        onConnectionRecovery: async () => {
          await this.#handleConnectionRecovery(params);
        },
      },
    );

    this.#setSubscription(address, network, subscriptionId);

    return subscriptionId;
  }

  async #handleNotification(
    notification: AccountNotification,
    params: AccountMonitoringParams,
  ): Promise<void> {
    this.#logger.info(this.#loggerPrefix, `Account changed`, {
      notification,
      params,
    });

    const { onAccountChanged } = params;

    try {
      await onAccountChanged(notification, params);
    } catch (error) {
      this.#logger.warn(
        this.#loggerPrefix,
        `⚠️ Error calling onAccountChanged callback`,
        error,
      );
    }
  }

  async #handleConnectionRecovery(
    params: AccountMonitoringParams,
  ): Promise<void> {
    this.#logger.info(this.#loggerPrefix, `Connection recovery`, {
      params,
    });

    const { address, commitment, network, onAccountChanged } = params;

    // Fetch the account info from the RPC HTTP API
    const account = await this.#connection
      .getRpc(network)
      .getAccountInfo(asAddress(address), {
        commitment,
        encoding: 'jsonParsed',
      })
      .send();

    // Simulate a notification to dispatch the latest account info to all listeners
    await onAccountChanged(account, params);
  }

  /**
   * Stops monitoring an account for changes on a given network.
   * @param address - The account address.
   * @param network - The network.
   */
  async stopMonitoring(address: string, network: Network): Promise<void> {
    this.#logger.info(this.#loggerPrefix, `Stopping monitoring`, {
      address,
      network,
    });

    const subscriptionId = this.#getSubscription(address, network);
    if (subscriptionId) {
      await this.#subscriptionService.unsubscribe(subscriptionId);
    }

    this.#removeSubscription(address, network);
  }

  /**
   * Stores the subscription ID for a given address and network.
   * @param address - The account address.
   * @param network - The network.
   * @param subscriptionId - The subscription ID.
   */
  #setSubscription(
    address: string,
    network: Network,
    subscriptionId: string,
  ): void {
    let networkMap = this.#subscriptions.get(address);
    if (!networkMap) {
      networkMap = new Map<Network, string>();
      this.#subscriptions.set(address, networkMap);
    }
    networkMap.set(network, subscriptionId);
  }

  /**
   * Retrieves the subscription ID for a given address and network.
   * @param address - The account address.
   * @param network - The network.
   * @returns The subscription ID, or undefined if not found.
   */
  #getSubscription(address: string, network: Network): string | undefined {
    const networkMap = this.#subscriptions.get(address);
    return networkMap?.get(network);
  }

  /**
   * Removes the subscription ID for a given address and network.
   * @param address - The account address.
   * @param network - The network.
   */
  #removeSubscription(address: string, network: Network): void {
    const networkMap = this.#subscriptions.get(address);
    if (networkMap) {
      networkMap.delete(network);
      if (networkMap.size === 0) {
        this.#subscriptions.delete(address);
      }
    }
  }
}
