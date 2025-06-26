import { difference } from 'lodash';

import { Network } from '../../core/constants/solana';
import type { SubscriptionConnectionManagerPort } from '../../core/ports';
import type { ConfigProvider } from '../../core/services/config';
import type { ILogger } from '../../core/utils/logger';
import type { SubscriptionConnectionRepository } from './SubscriptionConnectionRepository';

/**
 * Manages WebSocket connections for different Solana networks, providing robust connection
 * lifecycle management with automatic retry logic, reconnection handling, and connection
 * state tracking.
 *
 * Key Features:
 * - Maintains a mapping between Solana networks and their corresponding WebSocket connection IDs
 * - Implements exponential backoff strategy for failed connections with configurable maximum retry attempts
 * - Automatically handles disconnections and attempts reconnection with proper cleanup of stale connection mappings
 * - Processes WebSocket connection events (connect, disconnect, error) and triggers appropriate recovery mechanisms
 * - Converts HTTP RPC URLs to WebSocket URLs for subscription endpoints
 */
export class SubscriptionConnectionManagerAdapter
  implements SubscriptionConnectionManagerPort
{
  readonly #configProvider: ConfigProvider;

  readonly #subscriptionConnectionRepository: SubscriptionConnectionRepository;

  readonly #logger: ILogger;

  readonly #maxReconnectAttempts: number;

  readonly #reconnectDelayMilliseconds: number;

  readonly #connectionRecoveryCallbacks: (() => Promise<void>)[] = [];

  constructor(
    subscriptionConnectionRepository: SubscriptionConnectionRepository,
    configProvider: ConfigProvider,
    logger: ILogger,
  ) {
    const { maxReconnectAttempts, reconnectDelayMilliseconds } =
      configProvider.get().subscription;

    this.#subscriptionConnectionRepository = subscriptionConnectionRepository;
    this.#configProvider = configProvider;
    this.#logger = logger;
    this.#maxReconnectAttempts = maxReconnectAttempts;
    this.#reconnectDelayMilliseconds = reconnectDelayMilliseconds;
  }

  async openConnection(network: Network): Promise<string> {
    const wsUrl = this.#getWebSocketUrl(network);

    // Check if the connection already exists
    const existingConnection =
      await this.#subscriptionConnectionRepository.findByUrl(wsUrl);

    if (existingConnection) {
      return existingConnection.id;
    }

    let attempts = 0;

    while (attempts < this.#maxReconnectAttempts) {
      try {
        const networkConfig = this.#configProvider.getNetworkBy(
          'caip2Id',
          network,
        );
        const rpcUrl = networkConfig.rpcUrls[0];

        if (!rpcUrl) {
          throw new Error(`No RPC URL found for network ${network}`);
        }

        this.#logger.info(
          `[${this.constructor.name}] Opening connection to ${wsUrl} (attempt ${attempts + 1}/${this.#maxReconnectAttempts})`,
        );

        // const protocols = []; // TODO: What do we need to do here?
        const connectionId =
          await this.#subscriptionConnectionRepository.save(wsUrl);

        this.#logger.info(
          `[${this.constructor.name}] Connected with ID: ${connectionId}`,
        );

        return connectionId;
      } catch (error) {
        attempts += 1;

        if (attempts >= this.#maxReconnectAttempts) {
          this.#logger.error(
            `[${this.constructor.name}] Failed to open connection after all retry attempts:`,
            error,
          );
          throw error;
        }

        const delay =
          this.#reconnectDelayMilliseconds * Math.pow(2, attempts - 1);
        this.#logger.info(
          `[${this.constructor.name}] Connection attempt ${attempts} failed, retrying in ${delay}ms:`,
          error,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Unexpected end of openConnection method');
  }

  async closeConnection(network: Network): Promise<void> {
    const wsUrl = this.#getWebSocketUrl(network);

    // Early return if the connection does not exist
    const existingConnection =
      await this.#subscriptionConnectionRepository.findByUrl(wsUrl);

    if (!existingConnection) {
      this.#logger.warn(
        `[${this.constructor.name}] Tried to close connection for network ${network} but no connection was found`,
      );
      return;
    }

    const connectionId = existingConnection.id;

    try {
      await this.#subscriptionConnectionRepository.delete(connectionId);

      this.#logger.info(
        `[${this.constructor.name}] Closed connection ${connectionId}`,
      );
    } catch (error) {
      this.#logger.error(
        `[${this.constructor.name}] Failed to close connection:`,
        error,
      );
    }
  }

  async setupAllConnections(): Promise<void> {
    const { activeNetworks } = this.#configProvider.get();
    const inactiveNetworks = difference(Object.values(Network), activeNetworks);

    const connections = await this.#subscriptionConnectionRepository.getAll();

    const isConnectionOpen = (network: Network) =>
      connections.some(
        (connection) => connection.url === this.#getWebSocketUrl(network),
      );

    // Open the connections for the active networks that are not already open
    const openingPromises = activeNetworks
      .filter((network) => !isConnectionOpen(network))
      .map(async (network) => this.openConnection(network));

    // Close the connections for the inactive networks that are already open
    const closingPromises = inactiveNetworks
      .filter(isConnectionOpen)
      .map(async (network) => this.closeConnection(network));

    await Promise.all([...openingPromises, ...closingPromises]);
  }

  onConnectionRecovery(callback: () => Promise<void>): void {
    this.#connectionRecoveryCallbacks.push(callback);
  }

  getConnectionIdByNetwork(network: Network): string | null {
    const wsUrl = this.#getWebSocketUrl(network);
    return this.#subscriptionConnectionRepository.getIdByUrl(wsUrl) ?? null;
  }

  async handleConnectionEvent(
    connectionId: string,
    eventType: 'connected' | 'disconnected',
  ): Promise<void> {
    switch (eventType) {
      case 'connected':
        await this.#handleConnected(connectionId);
        break;
      case 'disconnected':
        await this.#handleDisconnected(connectionId);
        break;
      default:
        this.#logger.warn(
          `[${this.constructor.name}] Unknown connection event type: ${eventType}`,
        );
    }
  }

  async #handleConnected(connectionId: string): Promise<void> {
    this.#logger.info(
      `[${this.constructor.name}] Handling connection open for ${connectionId}`,
    );

    const existingConnection =
      await this.#subscriptionConnectionRepository.getById(connectionId);

    if (!existingConnection) {
      this.#logger.warn(
        `[${this.constructor.name}] No connection found for connection open: ${connectionId}`,
      );
      return;
    }

    // Trigger all recovery callbacks
    const recoveryPromises = this.#connectionRecoveryCallbacks.map(
      async (callback) => {
        try {
          await callback();
        } catch (error) {
          this.#logger.error(
            `[${this.constructor.name}] Error in connection recovery callback:`,
            error,
          );
        }
      },
    );

    await Promise.allSettled(recoveryPromises);
  }

  async #handleDisconnected(connectionId: string): Promise<void> {
    this.#logger.info(
      `[${this.constructor.name}] Handling disconnection, attempting to reconnect...`,
    );

    try {
      const connection =
        await this.#subscriptionConnectionRepository.getById(connectionId);

      if (!connection) {
        this.#logger.warn(
          `[${this.constructor.name}] No connection found for disconnection: ${connectionId}`,
        );
        return;
      }

      const network = this.#findNetworkForConnectionUrl(connection.url);

      if (network) {
        // Attempt to reconnect
        await this.openConnection(network);
      }
    } catch (error) {
      this.#logger.error(
        `[${this.constructor.name}] Reconnection failed:`,
        error,
      );
    }
  }

  /**
   * Converts an HTTP RPC URL to a WebSocket URL.
   * @param network - The network to get the WebSocket URL for.
   * @returns The WebSocket URL.
   */
  #getWebSocketUrl(network: Network): string {
    const networkConfig = this.#configProvider.getNetworkBy('caip2Id', network);
    const rpcUrl = networkConfig.rpcUrls[0];

    if (!rpcUrl) {
      throw new Error(`No RPC URL found for network ${network}`);
    }

    return rpcUrl.replace(/^https?:\/\//u, 'wss://').replace(/\/$/u, '');
  }

  /**
   * Gets the network for the specified connection ID.
   * @param connectionUrl - The connection URL to get the network for.
   * @returns The network, or null if no network is associated with the connection ID.
   */
  #findNetworkForConnectionUrl(connectionUrl: string): Network | null {
    const allNetworks = Object.values(Network);
    const network = allNetworks.find(
      (it) => this.#getWebSocketUrl(it) === connectionUrl,
    );
    return network ?? null;
  }
}
