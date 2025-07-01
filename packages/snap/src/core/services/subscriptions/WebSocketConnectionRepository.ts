import type { WebSocketConnection } from '../../../entities';
import type { Network } from '../../constants/solana';
import type { ConfigProvider } from '../config';

/**
 * Repository that is treating the Snap's WebSocket storage as a persistent data store, where:
 * - snap.request('snap_getWebSockets') = SELECT query
 * - snap.request('snap_openWebSocket') = INSERT operation
 * - snap.request('snap_closeWebSocket') = DELETE operation
 *
 * It also tracks bidirectional mappings between the connection ID and the URL to perform fast lookups.
 */
export class WebSocketConnectionRepository {
  readonly #configProvider: ConfigProvider;

  constructor(configProvider: ConfigProvider) {
    this.#configProvider = configProvider;
  }

  /**
   * Gets all connections.
   * @returns All connections.
   */
  async getAll(): Promise<WebSocketConnection[]> {
    const snapConnections = await snap.request({
      method: 'snap_getWebSockets',
    });

    // Enhance the connections with the network
    return snapConnections.map((connection) => ({
      ...connection,
      network: this.#findNetworkByWebSocketUrl(connection.url),
    }));
  }

  /**
   * Gets the connection for the specified ID.
   * @param id - The ID of the connection to get.
   * @returns The connection, or null if no connection exists for the ID.
   */
  async getById(id: string): Promise<WebSocketConnection | null> {
    const existingConnections = await this.getAll();
    return (
      existingConnections.find((connection) => connection.id === id) ?? null
    );
  }

  /**
   * Finds the connection for the specified network.
   * @param network - The network to find the connection for.
   * @returns The connection, or null if no connection exists for the network.
   */
  async findByNetwork(network: Network): Promise<WebSocketConnection | null> {
    const existingConnections = await this.getAll();
    return (
      existingConnections.find(
        (connection) => connection.network === network,
      ) ?? null
    );
  }

  /**
   * Creates a new connection to the specified URL.
   * @param connection - The connection to create, without the `id` field.
   * @returns The connection ID.
   */
  async save(
    connection: Omit<WebSocketConnection, 'id'>,
  ): Promise<WebSocketConnection> {
    const { url, protocols } = connection;

    const id = await snap.request({
      method: 'snap_openWebSocket',
      params: {
        url,
        ...(protocols ? { protocols } : {}),
      },
    });

    return {
      ...connection,
      id,
    };
  }

  /**
   * Closes the connection with the specified ID.
   * @param id - The ID of the connection to close.
   */
  async delete(id: string) {
    await snap.request({
      method: 'snap_closeWebSocket',
      params: { id },
    });
  }

  /**
   * Gets the network for the specified connection ID.
   * @param webSocketUrl - The WebSocket URL to get the network for.
   * @returns The network.
   */
  #findNetworkByWebSocketUrl(webSocketUrl: string): Network {
    const network = this.#configProvider.getNetworkBy(
      'webSocketUrl',
      webSocketUrl,
    );

    if (!network) {
      throw new Error(`No network found for WebSocket URL: ${webSocketUrl}`);
    }

    return network.caip2Id;
  }
}
