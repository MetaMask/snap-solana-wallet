import type { Network } from '../constants/solana';

export type WebSocketSubscription = {
  id: string;
  method: string;
  params: any[];
  callback: (notification: any) => Promise<void>;
};

/**
 * Port interface for WebSocket transport operations.
 * Defines the contract for managing WebSocket connections, subscriptions, and message handling.
 */
export type WebSocketTransportPort = {
  /**
   * Opens a WebSocket connection for the specified network.
   * @param network - The network to open a connection for.
   * @returns A promise that resolves to the connection ID.
   */
  openConnection(network: Network): Promise<string>;

  /**
   * Closes the WebSocket connection for the specified network.
   * @param network - The network to close the connection for.
   */
  closeConnection(network: Network): Promise<void>;

  /**
   * Subscribes to a specific subscription.
   * @param connectionId - The connection ID to subscribe to.
   * @param subscription - The subscription to subscribe to.
   */
  subscribe(
    connectionId: string,
    subscription: WebSocketSubscription,
  ): Promise<void>;

  /**
   * Unsubscribes from a specific subscription.
   * @param subscriptionId - The ID of the subscription to unsubscribe from.
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Handles incoming WebSocket messages.
   * @param connectionId - The connection ID that received the message.
   * @param messageData - The WebSocket message data.
   */
  handleMessage(connectionId: string, messageData: any): Promise<void>;

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
