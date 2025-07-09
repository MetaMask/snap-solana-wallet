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
   * Monitors an account for changes on a given network, and executes the passed
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

    await onAccountChanged(notification, params);
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

  async stopMonitoring(subscriptionId: string): Promise<void> {
    await this.#subscriptionService.unsubscribe(subscriptionId);
  }
}
