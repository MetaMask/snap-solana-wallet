import type { GetWebSocketsResult } from '@metamask/snaps-sdk';

/**
 * Repository that is treating the Snap's WebSocket storage as a persistent data store, where:
 * - snap.request('snap_getWebSockets') = SELECT query
 * - snap.request('snap_openWebSocket') = INSERT operation
 * - snap.request('snap_closeWebSocket') = DELETE operation
 *
 * It also tracks bidirectional mappings between the connection ID and the URL to perform fast lookups.
 */
export class ConnectionRepository {
  // Internal map: url -> connection ID, to perform fast forward lookups
  readonly #urlToConnectionId: Map<string, string> = new Map();

  // Internal map: connection ID -> url, to perform fast reverse lookups.
  readonly #connectionIdToUrl: Map<string, string> = new Map();

  async getAll(): Promise<GetWebSocketsResult> {
    return snap.request({
      method: 'snap_getWebSockets',
    });
  }

  async getById(
    connectionId: string,
  ): Promise<GetWebSocketsResult[number] | null> {
    const existingConnections = await this.getAll();
    return (
      existingConnections.find(
        (connection) => connection.id === connectionId,
      ) ?? null
    );
  }

  async findByUrl(url: string): Promise<GetWebSocketsResult[number] | null> {
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

    this.#urlToConnectionId.set(url, connectionId);
    this.#connectionIdToUrl.set(connectionId, url);

    return connectionId;
  }

  /**
   * Closes the connection with the specified ID.
   * @param connectionId - The ID of the connection to close.
   */
  async delete(connectionId: string) {
    await snap.request({
      method: 'snap_closeWebSocket',
      params: { id: connectionId },
    });

    const url = this.#connectionIdToUrl.get(connectionId);
    if (url) {
      this.#urlToConnectionId.delete(url);
      this.#connectionIdToUrl.delete(connectionId);
    }
  }

  getIdByUrl(url: string): string | null {
    return this.#urlToConnectionId.get(url) ?? null;
  }

  getUrlById(connectionId: string): string | null {
    return this.#connectionIdToUrl.get(connectionId) ?? null;
  }
}
