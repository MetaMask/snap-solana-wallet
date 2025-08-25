import type {
  WebSocketCloseEvent,
  WebSocketEvent,
  WebSocketOpenEvent,
} from '@metamask/snaps-sdk';

import type {
  ConnectionRecoveryHandler,
  WebSocketConnection,
} from '../../../entities';
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

  readonly #connectionRecoveryHandlers: Map<
    Network,
    ConnectionRecoveryHandler[]
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
    // Aliases to make the code more readable
    const openAll = this.#openConnectionsForActiveNetworks.bind(this);
    const closeAll = this.#closeAllConnections.bind(this);

    // When the extension becomes active, starts, or that the snap is updated / installed, the Snap platform might have lost its previously opened websockets, so we make sure the are open
    this.#eventEmitter.on('onStart', openAll);
    this.#eventEmitter.on('onUpdate', openAll);
    this.#eventEmitter.on('onInstall', openAll);
    this.#eventEmitter.on('onActive', openAll);

    // When the extension becomes inactive, we close all connections
    this.#eventEmitter.on('onInactive', closeAll);

    this.#eventEmitter.on(
      'onWebSocketEvent',
      this.#handleWebSocketEvent.bind(this),
    );

    // Specific binds to enable manual testing from the test dapp
    this.#eventEmitter.on('onListWebSockets', this.#listConnections.bind(this));
  }

  async #openConnectionsForActiveNetworks(): Promise<void> {
    this.#logger.log(`Opening connections for active networks`);

    const { activeNetworks } = this.#configProvider.get();

    this.#retryAttempts.clear();

    // Open the connections for the active networks
    await Promise.allSettled(
      activeNetworks.map(async (network) => {
        await this.openConnection(network);
      }),
    );
  }

  /**
   * Idempotently opens a WebSocket connection for the given network.
   * If a connection already exists for the network, this method does nothing.
   * @param network - The network for which to open a connection.
   * @returns A promise that resolves when the connection is established or already exists.
   */
  async openConnection(network: Network): Promise<void> {
    this.#logger.log(`Opening connection for network ${network}`);

    // Get the websocket url
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

  async #closeAllConnections(): Promise<void> {
    this.#logger.log(`Closing all connections`);

    const connections = await this.#connectionRepository.getAll();
    await Promise.allSettled(connections.map(this.#closeConnection.bind(this)));
  }

  async #closeConnection(connection: WebSocketConnection): Promise<void> {
    this.#logger.log(`Closing connection for network ${connection.network}`);

    await this.#connectionRepository.delete(connection.id);
  }

  /**
   * Registers a handler to be called when connection is recovered.
   * @param network - The network to register the handler for.
   * @param handler - The handler function to register.
   */
  onConnectionRecovery(
    network: Network,
    handler: ConnectionRecoveryHandler,
  ): void {
    const existingHandlers =
      this.#connectionRecoveryHandlers.get(network) ?? [];

    this.#connectionRecoveryHandlers.set(network, [
      ...existingHandlers,
      handler,
    ]);
  }

  /**
   * Gets the connection ID for the specified network.
   * @param network - The network to get the connection ID for.
   * @returns The connection ID, or null if no connection exists for the network.
   */
  async findByNetwork(network: Network): Promise<WebSocketConnection | null> {
    const connection = await this.#connectionRepository.findByNetwork(network);
    return connection ?? null;
  }

  /**
   * Gets the connection for the specified ID.
   * @param id - The ID of the connection to get.
   * @returns The connection, or null if no connection exists for the ID.
   */
  async findById(id: string): Promise<WebSocketConnection | null> {
    return this.#connectionRepository.getById(id);
  }

  async #handleWebSocketEvent(event: WebSocketEvent): Promise<void> {
    // We only care about open and close events, that inform us about connection lifecycle
    if (event.type !== 'open' && event.type !== 'close') {
      return;
    }

    const { id: connectionId, type } = event;

    this.#logger.log(
      `Handling connection event "${type}" for ${connectionId}`,
      event,
    );

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

    const handlers = this.#connectionRecoveryHandlers.get(network) ?? [];

    this.#logger.log(
      `Triggering ${handlers.length} connection recovery handlers`,
      network,
    );

    // Trigger all recovery handlers
    const recoveryPromises =
      handlers.map(async (handler) => {
        try {
          await handler(network);
        } catch (error) {
          this.#logger.error(`Error in connection recovery handler`, error);
        }
      }) ?? [];

    await Promise.allSettled(recoveryPromises);
  }

  async #handleDisconnected(event: WebSocketCloseEvent): Promise<void> {
    const { wasClean } = event;

    // If the connection was closed cleanly (= we close it intentionally), we don't need to attempt to reconnect
    if (wasClean) {
      this.#logger.log(`✅ Connection closed cleanly`, event);
      return;
    }

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
      connectionRecoveryHandlers: this.#connectionRecoveryHandlers,
    });
  }
}
