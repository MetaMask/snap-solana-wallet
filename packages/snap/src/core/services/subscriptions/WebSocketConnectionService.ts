import type {
  WebSocketCloseEvent,
  WebSocketEvent,
  WebSocketOpenEvent,
} from '@metamask/snaps-sdk';

import type { WebSocketConnection } from '../../../entities';
import type { EventEmitter } from '../../../infrastructure';
import type { Network } from '../../constants/solana';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { ConfigProvider } from '../config';
import type { WebSocketConnectionRepository } from './WebSocketConnectionRepository';

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
export class WebSocketConnectionService {
  readonly #configProvider: ConfigProvider;

  readonly #connectionRepository: WebSocketConnectionRepository;

  readonly #eventEmitter: EventEmitter;

  readonly #logger: ILogger;

  readonly #maxReconnectAttempts: number;

  readonly #reconnectDelayMilliseconds: number;

  readonly #connectionRecoveryCallbacks: Map<
    Network,
    ((network: Network) => Promise<void>)[]
  > = new Map();

  readonly #retryAttempts: Map<Network, number> = new Map();

  constructor(
    connectionRepository: WebSocketConnectionRepository,
    configProvider: ConfigProvider,
    eventEmitter: EventEmitter,
    logger: ILogger,
  ) {
    const { maxReconnectAttempts, reconnectDelayMilliseconds } =
      configProvider.get().subscriptions;

    this.#connectionRepository = connectionRepository;
    this.#configProvider = configProvider;
    this.#eventEmitter = eventEmitter;
    this.#logger = createPrefixedLogger(
      logger,
      '[🔌 WebSocketConnectionService]',
    );
    this.#maxReconnectAttempts = maxReconnectAttempts;
    this.#reconnectDelayMilliseconds = reconnectDelayMilliseconds;

    this.#bindHandlers();
  }

  #bindHandlers(): void {
    // When the extension starts, or that the snap is updated / installed, the Snap platform has lost all its previously opened websockets, so we need to re-initialize
    this.#eventEmitter.on('onStart', this.#handleOnStart.bind(this));
    this.#eventEmitter.on('onUpdate', this.#handleOnStart.bind(this));
    this.#eventEmitter.on('onInstall', this.#handleOnStart.bind(this));

    this.#eventEmitter.on(
      'onWebSocketEvent',
      this.#handleWebSocketEvent.bind(this),
    );

    // Specific binds to enable manual testing from the test dapp
    this.#eventEmitter.on('onListWebSockets', this.#listConnections.bind(this));
  }

  async #handleOnStart(): Promise<void> {
    this.#logger.log(`Handling onStart/onUpdate/onInstall`);

    const { activeNetworks } = this.#configProvider.get();

    // Clean up the connection recovery callbacks and retry attempts for all networks
    // this.#connectionRecoveryCallbacks.clear();
    this.#retryAttempts.clear();

    // Open the connections for the active networks
    await Promise.allSettled(
      activeNetworks.map(async (network) => {
        await this.openConnection(network);
      }),
    );
  }

  /**
   * Opens a connection for the specified network.
   * @param network - The network to open a connection for.
   * @returns A promise that resolves to the connection.
   */
  async openConnection(network: Network): Promise<void> {
    this.#logger.log(`Opening connection for network ${network}`);

    const networkConfig = this.#configProvider.getNetworkBy('caip2Id', network);
    const { webSocketUrl } = networkConfig;

    // Check if a connection already exists for this network
    const existingConnection =
      await this.#connectionRepository.findByNetwork(network);

    if (existingConnection) {
      this.#logger.log(`✅ Connection for network ${network} already exists`);
      return;
    }

    await this.#connectionRepository.save({
      network,
      url: webSocketUrl,
      protocols: [],
    });
  }

  /**
   * Registers a callback to be called when connection is recovered.
   * @param network - The network to register the callback for.
   * @param callback - The callback function to register.
   */
  onConnectionRecovery(
    network: Network,
    callback: (network: Network) => Promise<void>,
  ): void {
    const existingCallbacks =
      this.#connectionRecoveryCallbacks.get(network) ?? [];

    this.#connectionRecoveryCallbacks.set(network, [
      ...existingCallbacks,
      callback,
    ]);
  }

  /**
   * Gets the connection ID for the specified network.
   * @param network - The network to get the connection ID for.
   * @returns The connection ID, or null if no connection exists for the network.
   */
  async getConnectionIdByNetwork(network: Network): Promise<string | null> {
    const connection = await this.#connectionRepository.findByNetwork(network);

    return connection?.id ?? null;
  }

  /**
   * Gets the connection for the specified ID.
   * @param id - The ID of the connection to get.
   * @returns The connection, or null if no connection exists for the ID.
   */
  async getById(id: string): Promise<WebSocketConnection | null> {
    return this.#connectionRepository.getById(id);
  }

  async #handleWebSocketEvent(event: WebSocketEvent): Promise<void> {
    // We only care about open and close events, that inform us about connection lifecycle
    if (event.type !== 'open' && event.type !== 'close') {
      return;
    }

    const { id: connectionId, type } = event;

    this.#logger.log(`Handling connection event "${type}" for ${connectionId}`);

    switch (type) {
      case 'open':
        await this.#handleConnected(event);
        break;
      case 'close':
        await this.#handleDisconnected(event);
        break;
      default:
        this.#logger.warn(`Unknown connection event type: ${type}`);
    }
  }

  async #handleConnected(event: WebSocketOpenEvent): Promise<void> {
    const { id: connectionId } = event;
    const connection = await this.#connectionRepository.getById(connectionId);

    if (!connection) {
      this.#logger.warn(`No connection found with id: ${connectionId}`);
      return;
    }

    this.#logger.log(`✅ Connected to ${connectionId}`, event);

    const { network } = connection;

    // Reset retry attempts on successful connection
    this.#retryAttempts.delete(network);

    const callbacks = this.#connectionRecoveryCallbacks.get(network) ?? [];

    this.#logger.log(
      `Triggering ${callbacks.length} connection recovery callbacks`,
      network,
    );

    // Trigger all recovery callbacks
    const recoveryPromises =
      callbacks.map(async (callback) => {
        try {
          await callback(network);
        } catch (error) {
          this.#logger.error(`Error in connection recovery callback:`, error);
        }
      }) ?? [];

    await Promise.allSettled(recoveryPromises);
  }

  async #handleDisconnected(event: WebSocketCloseEvent): Promise<void> {
    // Here, we cannot rely on this.#connectionRepository.getById() because the connection doesn't exist anymore,
    // so we need to find the network from the event origin
    const { origin } = event;

    const { networks } = this.#configProvider.get();
    const network = networks.find((item) =>
      item.webSocketUrl.startsWith(origin),
    );

    if (!network) {
      this.#logger.warn(`No network found for origin`, origin);
      return;
    }

    await this.#attemptReconnect(network.caip2Id);
  }

  async #attemptReconnect(network: Network): Promise<void> {
    const currentAttempts = this.#retryAttempts.get(network) ?? 0;
    const nextAttempt = currentAttempts + 1;
    this.#retryAttempts.set(network, nextAttempt);

    if (nextAttempt > this.#maxReconnectAttempts) {
      this.#logger.error(
        `❌ Failed to reconnect to ${network} after ${this.#maxReconnectAttempts}/${this.#maxReconnectAttempts} attempts. Giving up.`,
      );
      return;
    }

    const delay =
      this.#reconnectDelayMilliseconds * Math.pow(2, currentAttempts);
    this.#logger.warn(
      `❌ Disconnected from ${network}. Will try reconnecting in ${delay}ms (attempt ${nextAttempt}/${this.#maxReconnectAttempts})`,
    );

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        this.openConnection(network)
          .catch((error) => {
            this.#logger.info(`Error opening connection for ${network}`, error);
            // Do nothing else here. If the connection fails to open, we receive a disconnect event,
            // that will be handled by the #handleDisconnected method.
          })
          .finally(() => resolve());
      }, delay);
    });
  }

  async #listConnections(): Promise<void> {
    const connections = await this.#connectionRepository.getAll();

    this.#logger.log(`All connections`, {
      connections,
      connectionRecoveryCallbacks: this.#connectionRecoveryCallbacks,
    });
  }
}
