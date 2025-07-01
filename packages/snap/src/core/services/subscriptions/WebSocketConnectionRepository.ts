import type { WebSocketConnection } from '../../../entities';

/**
 * Repository that is treating the Snap's WebSocket storage as a persistent data store, where:
 * - snap.request('snap_getWebSockets') = SELECT query
 * - snap.request('snap_openWebSocket') = INSERT operation
 * - snap.request('snap_closeWebSocket') = DELETE operation
 *
 * It also tracks bidirectional mappings between the connection ID and the URL to perform fast lookups.
 */
export class WebSocketConnectionRepository {
  async getAll(): Promise<WebSocketConnection[]> {
    return snap.request({
      method: 'snap_getWebSockets',
    });
  }

  async getById(id: string): Promise<WebSocketConnection | null> {
    const existingConnections = await this.getAll();
    return (
      existingConnections.find((connection) => connection.id === id) ?? null
    );
  }

  async findByUrl(url: string): Promise<WebSocketConnection | null> {
    const existingConnections = await this.getAll();

    return (
      existingConnections.find((connection) => connection.url === url) ?? null
    );
  }

  /**
   * Creates a new connection to the specified URL.
   * @param url - The URL of the connection.
   * @param protocols - The protocols of the connection.
   * @returns The connection ID.
   */
  async save(url: string, protocols?: string[]) {
    const connectionId = await snap.request({
      method: 'snap_openWebSocket',
      params: {
        url,
        ...(protocols ? { protocols } : {}),
      },
    });

    return connectionId;
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
}
