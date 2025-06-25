import type { Network } from '../constants/solana';

export type WebSocketConnectionManagerPort = {
  /**
   * Opens a connection for the specified network.
   * @param network - The network to open a connection for.
   * @returns A promise that resolves to the connection ID.
   */
  openConnection(network: Network): Promise<string>;

  /**
   * Closes the connection for the specified network.
   * @param network - The network to close the connection for.
   */
  closeConnection(network: Network): Promise<void>;

  /**
   * Sets up connections for all networks.
   * - Opens the connections for all enabled networks that are not already open.
   * - Closes the connections for all disabled networks.
   * @returns A promise that resolves when the connections are setup.
   */
  setupAllConnections(): Promise<void>;

  /**
   * Gets the connection ID for the specified network.
   * @param network - The network to get the connection ID for.
   * @returns The connection ID, or null if no connection exists for the network.
   */
  getConnectionId(network: Network): string | null;

  /**
   * Handles connection events (connect, disconnect, error).
   * @param connectionId - The connection ID for the event.
   * @param event - The type of connection event.
   * @param data - Optional event data.
   */
  handleConnectionEvent(
    connectionId: string,
    event: 'connect' | 'disconnect' | 'error',
    data?: any,
  ): Promise<void>;

  /**
   * Registers a callback to be called when connection is recovered.
   * @param callback - The callback function to register.
   */
  onConnectionRecovery(callback: () => Promise<void>): void;
};
