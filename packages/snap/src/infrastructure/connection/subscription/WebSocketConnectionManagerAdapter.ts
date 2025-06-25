import type { Network } from '../../../core/constants/solana';
import type { WebSocketConnectionManagerPort } from '../../../core/ports';
import type { ConfigProvider } from '../../../core/services/config';
import type { ILogger } from '../../../core/utils/logger';

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
export class WebSocketConnectionManagerAdapter
  implements WebSocketConnectionManagerPort
{
  readonly #networkToConnectionId: Map<Network, string> = new Map(); // network -> connection ID

  readonly #configProvider: ConfigProvider;

  readonly #logger: ILogger;

  #maxReconnectAttempts = 5;

  #reconnectDelay = 1000; // Start with 1 second

  #connectionRecoveryCallbacks: (() => Promise<void>)[] = [];

  constructor(configProvider: ConfigProvider, logger: ILogger) {
    this.#configProvider = configProvider;
    this.#logger = logger;
  }

  async openConnection(network: Network): Promise<string> {
    let attempts = 0;

    while (attempts < this.#maxReconnectAttempts) {
      try {
        // Check if the connection already exists
        const existingConnectionId = this.#networkToConnectionId.get(network);
        if (existingConnectionId) {
          return existingConnectionId;
        }

        const networkConfig = this.#configProvider.getNetworkBy(
          'caip2Id',
          network,
        );
        const rpcUrl = networkConfig.rpcUrls[0];

        if (!rpcUrl) {
          throw new Error(`No RPC URL found for network ${network}`);
        }

        const wsUrl = this.#getWebSocketUrl(rpcUrl);

        this.#logger.info(
          `[WebSocketJsonRpcSubscriptionAdapter] Opening connection to ${wsUrl} (attempt ${attempts + 1}/${this.#maxReconnectAttempts})`,
        );

        const connectionId = await snap.request({
          method: 'snap_openWebSocket',
          params: {
            url: wsUrl,
            //   protocols: [], // TODO: What do we need to do here?
          },
        });

        this.#networkToConnectionId.set(network, connectionId);

        this.#logger.info(
          `[WebSocketJsonRpcSubscriptionAdapter] Connected with ID: ${connectionId}`,
        );

        return connectionId;
      } catch (error) {
        attempts += 1;

        if (attempts >= this.#maxReconnectAttempts) {
          this.#logger.error(
            '[WebSocketJsonRpcSubscriptionAdapter] Failed to open connection after all retry attempts:',
            error,
          );
          throw error;
        }

        const delay = this.#reconnectDelay * Math.pow(2, attempts - 1);
        this.#logger.info(
          `[WebSocketJsonRpcSubscriptionAdapter] Connection attempt ${attempts} failed, retrying in ${delay}ms:`,
          error,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Unexpected end of openConnection method');
  }

  async closeConnection(network: Network): Promise<void> {
    const connectionId = this.#networkToConnectionId.get(network);
    if (!connectionId) {
      return;
    }

    try {
      await snap.request({
        method: 'snap_closeWebSocket',
        params: { id: connectionId },
      });

      this.#networkToConnectionId.delete(network);

      this.#logger.info(
        `[WebSocketJsonRpcSubscriptionAdapter] Closed connection ${connectionId}`,
      );
    } catch (error) {
      this.#logger.error(
        '[WebSocketJsonRpcSubscriptionAdapter] Failed to close connection:',
        error,
      );
    }
  }

  async setupAllConnections(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getConnectionId(network: Network): string | null {
    return this.#networkToConnectionId.get(network) ?? null;
  }

  async handleConnectionEvent(
    connectionId: string,
    event: 'connect' | 'disconnect' | 'error',
    data?: any,
  ): Promise<void> {
    this.#logger.info(
      `[WebSocketJsonRpcSubscriptionAdapter] Connection event: ${event} for ${connectionId}`,
    );

    const isConnectionOpen = this.#isConnectionOpen(connectionId);

    if (event === 'disconnect' || event === 'error') {
      if (!isConnectionOpen) {
        this.#logger.warn(
          `[WebSocketJsonRpcSubscriptionAdapter] No connection found for event: ${event}`,
        );
        return;
      }
      await this.#handleDisconnection(connectionId);
    } else if (event === 'connect') {
      await this.#handleConnection(connectionId, event);
    }
  }

  onConnectionRecovery(callback: () => Promise<void>): void {
    this.#connectionRecoveryCallbacks.push(callback);
  }

  /**
   * Checks if the connection for the specified connection ID is open.
   * @param connectionId - The connection ID to check.
   * @returns True if the connection is open, false otherwise.
   */
  #isConnectionOpen(connectionId: string): boolean {
    return (
      Array.from(this.#networkToConnectionId.entries()).find(
        ([, id]) => id === connectionId,
      )?.[0] !== undefined
    );
  }

  /**
   * Gets the network for the specified connection ID.
   * @param connectionId - The connection ID to get the network for.
   * @returns The network, or null if no network is associated with the connection ID.
   */
  #getNetworkForConnection(connectionId: string): Network | null {
    return (
      Array.from(this.#networkToConnectionId.entries()).find(
        ([, id]) => id === connectionId,
      )?.[0] ?? null
    );
  }

  async #handleDisconnection(connectionId: string): Promise<void> {
    this.#logger.info(
      '[WebSocketJsonRpcSubscriptionAdapter] Handling disconnection, attempting to reconnect...',
    );

    try {
      const network = this.#getNetworkForConnection(connectionId);

      if (network) {
        // Remove the old connection mapping first
        this.#networkToConnectionId.delete(network);
        // Reconnect with retry logic
        await this.openConnection(network);
      }
    } catch (error) {
      this.#logger.error(
        '[WebSocketJsonRpcSubscriptionAdapter] Reconnection failed:',
        error,
      );
    }
  }

  async #handleConnection(
    connectionId: string,
    event: 'connect',
  ): Promise<void> {
    this.#logger.info(
      `[WebSocketJsonRpcSubscriptionAdapter] Handling connection event: ${event} for ${connectionId}`,
    );

    // Trigger all recovery callbacks
    const recoveryPromises = this.#connectionRecoveryCallbacks.map(
      async (callback) => {
        try {
          await callback();
        } catch (error) {
          this.#logger.error(
            '[WebSocketJsonRpcSubscriptionAdapter] Error in connection recovery callback:',
            error,
          );
        }
      },
    );

    await Promise.allSettled(recoveryPromises);
  }

  /**
   * Converts an HTTP RPC URL to a WebSocket URL.
   * @param httpUrl - The HTTP RPC URL to convert.
   * @returns The WebSocket URL.
   */
  #getWebSocketUrl(httpUrl: string): string {
    return httpUrl.replace(/^https?:\/\//u, 'wss://').replace(/\/$/u, '');
  }
}
