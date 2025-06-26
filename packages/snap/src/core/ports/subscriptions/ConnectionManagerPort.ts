import type { Network } from '../../constants/solana';

/**
 * Port interface for managing JSON-RPC subscription connections,
 * with connection lifecycle management and message handling.
 */
export type ConnectionManagerPort = {
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
   * Handles WebSocket connection lifecycle events.
   * @param connectionId - The connection ID for the event.
   * @param eventType - The type of connection event.
   */
  handleConnectionEvent(
    connectionId: string,
    eventType: 'connected' | 'disconnected',
  ): Promise<void>;

  /**
   * Registers a callback to be called when connection is recovered.
   * @param callback - The callback function to register.
   */
  onConnectionRecovery(callback: () => Promise<void>): void;

  /**
   * Gets the connection ID for the specified network.
   * @param network - The network to get the connection ID for.
   * @returns The connection ID, or null if no connection exists for the network.
   */
  getConnectionIdByNetwork(network: Network): string | null;
};
