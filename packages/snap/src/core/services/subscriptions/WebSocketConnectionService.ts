import type { WebSocketEvent } from '@metamask/snaps-sdk';
import { difference } from 'lodash';

import type { WebSocketConnection } from '../../../entities';
import type { EventEmitter } from '../../../infrastructure';
import { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
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

  readonly #logger: ILogger;

  readonly #loggerPrefix = '[🔌 WebSocketConnectionService]';

  readonly #maxReconnectAttempts: number;

  readonly #reconnectDelayMilliseconds: number;

  readonly #connectionRecoveryCallbacks: Map<Network, (() => Promise<void>)[]> =
    new Map();

  constructor(
    connectionRepository: WebSocketConnectionRepository,
    configProvider: ConfigProvider,
    eventEmitter: EventEmitter,
    logger: ILogger,
  ) {
    const { maxReconnectAttempts, reconnectDelayMilliseconds } =
      configProvider.get().subscription;

    this.#connectionRepository = connectionRepository;
    this.#configProvider = configProvider;
    this.#logger = logger;
    this.#maxReconnectAttempts = maxReconnectAttempts;
    this.#reconnectDelayMilliseconds = reconnectDelayMilliseconds;

    // When the snap starts / updates / installs, we setup all the connections
    eventEmitter.on('onStart', this.setupAllConnections.bind(this));
    eventEmitter.on('onUpdate', this.setupAllConnections.bind(this));
    eventEmitter.on('onInstall', this.setupAllConnections.bind(this));

    eventEmitter.on('onWebSocketEvent', this.#handleWebSocketEvent.bind(this));

    // Temporary binds to enable manual testing from the test dapp
    eventEmitter.on(
      'onTestSetupAllConnections',
      this.setupAllConnections.bind(this),
    );
    eventEmitter.on(
      'onTestCloseAllConnections',
      this.#closeAllConnections.bind(this),
    );
  }

  /**
   * Sets up connections for all networks.
   * - Opens the connections for all enabled networks that are not already open.
   * - Closes the connections for all disabled networks.
   * @returns A promise that resolves when the connections are setup.
   */
  async setupAllConnections(): Promise<void> {
    this.#logger.info(this.#loggerPrefix, `Setting up all connections`);

    const { activeNetworks } = this.#configProvider.get();
    const inactiveNetworks = difference(Object.values(Network), activeNetworks);

    const connections = await this.#connectionRepository.getAll();

    const isConnectionOpen = (network: Network) =>
      connections.some((connection) => connection.network === network);

    // Open the connections for the active networks that are not already open
    const openingPromises = activeNetworks
      .filter((network) => !isConnectionOpen(network))
      .map(async (network) => this.openConnection(network));

    // Close the connections for the inactive networks that are already open
    const closingPromises = inactiveNetworks
      .filter(isConnectionOpen)
      .map(async (network) => this.#closeConnection(network));

    await Promise.allSettled([...openingPromises, ...closingPromises]);
  }

  /**
   * Opens a connection for the specified network.
   * @param network - The network to open a connection for.
   * @returns A promise that resolves to the connection.
   */
  async openConnection(network: Network): Promise<WebSocketConnection> {
    this.#logger.info(
      this.#loggerPrefix,
      `Opening connection for network ${network}`,
    );

    const networkConfig = this.#configProvider.getNetworkBy('caip2Id', network);
    const { webSocketUrl } = networkConfig;

    // Check if a connection already exists for this network
    const existingConnection =
      await this.#connectionRepository.findByNetwork(network);

    if (existingConnection) {
      this.#logger.info(
        this.#loggerPrefix,
        `Connection for network ${network} already exists`,
        existingConnection,
      );
      return existingConnection;
    }

    let attempts = 0;

    while (attempts < this.#maxReconnectAttempts) {
      try {
        this.#logger.info(
          this.#loggerPrefix,
          `Opening connection for network ${network} to ${webSocketUrl} (attempt ${attempts + 1}/${this.#maxReconnectAttempts})`,
        );

        const connection = await this.#connectionRepository.save({
          network,
          url: webSocketUrl,
          protocols: [],
        });

        return connection;
      } catch (error) {
        attempts += 1;

        if (attempts >= this.#maxReconnectAttempts) {
          this.#logger.error(
            this.#loggerPrefix,
            `Failed to open connection after all retry attempts:`,
            error,
          );
          throw error;
        }

        const delay =
          this.#reconnectDelayMilliseconds * Math.pow(2, attempts - 1);
        this.#logger.info(
          this.#loggerPrefix,
          `Connection attempt ${attempts} failed, retrying in ${delay}ms:`,
          error,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Unexpected end of openConnection method');
  }

  /**
   * Closes the connection for the specified network.
   * This is an intentional close, not a disconnection, so it also removes the connection recovery callbacks for this network.
   * @param network - The network to close the connection for.
   */
  async #closeConnection(network: Network): Promise<void> {
    this.#logger.info(
      this.#loggerPrefix,
      `Closing connection for network ${network}`,
    );

    // Clean up the connection recovery callbacks for this network
    this.#connectionRecoveryCallbacks.delete(network);

    // Early return if the connection does not exist
    const existingConnection =
      await this.#connectionRepository.findByNetwork(network);

    if (!existingConnection) {
      this.#logger.warn(
        this.#loggerPrefix,
        `Tried to close connection for network ${network} but no connection was found`,
      );
      return;
    }

    const connectionId = existingConnection.id;

    try {
      await this.#connectionRepository.delete(connectionId);

      this.#logger.info(
        this.#loggerPrefix,
        ` ❌ Closed connection ${connectionId}`,
      );
    } catch (error) {
      this.#logger.error(
        this.#loggerPrefix,
        `Failed to close connection:`,
        error,
      );
    }
  }

  /**
   * Registers a callback to be called when connection is recovered.
   * @param network - The network to register the callback for.
   * @param callback - The callback function to register.
   */
  onConnectionRecovery(network: Network, callback: () => Promise<void>): void {
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

  async #handleWebSocketEvent(event: WebSocketEvent): Promise<void> {
    // We only care about open and close events, that inform us about connection lifecycle
    if (event.type !== 'open' && event.type !== 'close') {
      return;
    }

    const { id, type } = event;
    const connection = await this.#connectionRepository.getById(id);

    if (!connection) {
      this.#logger.warn(
        this.#loggerPrefix,
        `No connection found with id: ${id}`,
        event,
      );
      return;
    }

    const { network } = connection;

    this.#logger.info(
      this.#loggerPrefix,
      `Handling connection event: ${type} for ${id}`,
    );

    switch (type) {
      case 'open':
        await this.#handleConnected(network);
        break;
      case 'close':
        await this.#handleDisconnected(network);
        break;
      default:
        this.#logger.warn(
          this.#loggerPrefix,
          `Unknown connection event type: ${type}`,
        );
    }
  }

  async #handleConnected(network: Network): Promise<void> {
    this.#logger.info(this.#loggerPrefix, `✅ Connected to`, network);

    this.#logger.info(
      this.#loggerPrefix,
      `Triggering connection recovery callbacks`,
      network,
    );

    // Trigger all recovery callbacks
    const recoveryPromises =
      this.#connectionRecoveryCallbacks.get(network)?.map(async (callback) => {
        try {
          await callback();
        } catch (error) {
          this.#logger.error(
            this.#loggerPrefix,
            `Error in connection recovery callback:`,
            error,
          );
        }
      }) ?? [];

    await Promise.allSettled(recoveryPromises);
  }

  async #handleDisconnected(network: Network): Promise<void> {
    // Attempt to reconnect
    await this.openConnection(network);
  }

  /**
   * Closes connections for all networks.
   * This is used to test the connection recovery mechanism.
   */
  async #closeAllConnections(): Promise<void> {
    this.#logger.info(this.#loggerPrefix, `Closing all connections`);

    const allNetworks = Object.values(Network);

    const closePromises = allNetworks.map(async (network) => {
      await this.#closeConnection(network);
    });

    await Promise.allSettled(closePromises);
  }
}
