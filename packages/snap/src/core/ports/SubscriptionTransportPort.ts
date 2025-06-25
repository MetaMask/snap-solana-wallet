/**
 * A subscription to real-time notifications using JSON-RPC.
 *
 * @property id - Caller-provided ID for the subscription.
 * @property method - The method to subscribe to.
 * @property unsubscribeMethod - The method to unsubscribe from.
 * @property params - The parameters to subscribe to.
 * @property onNotification - The callback to be called when a notification is received.
 * @property onSubscriptionFailed - The callback to be called when the subscription could not be created.
 * @property onConnectionRecovery - The callback to be called when the connection is recovered. Typically a fetch to get the latest data.
 */
export type JsonRpcSubscription = {
  id: string;
  method: string;
  unsubscribeMethod: string;
  params: any[];
  onNotification: (notification: any) => Promise<void>;
  onSubscriptionFailed?: (error: any) => Promise<void>;
  onConnectionRecovery?: () => Promise<void>;
};

/**
 * Port interface for JSON-RPC subscription transport operations.
 *
 * Defines the contract for managing WebSocket-based JSON-RPC subscriptions,
 * with subscription lifecycle management and message handling.
 */
export type SubscriptionTransportPort = {
  /**
   * Subscribes to a specific method.
   * @param connectionId - The connection ID to subscribe to.
   * @param subscription - The subscription parameters.
   */
  subscribe(
    connectionId: string,
    subscription: JsonRpcSubscription,
  ): Promise<void>;

  /**
   * Unsubscribes from a specific subscription.
   * @param subscriptionId - The caller-provided ID of the subscription to unsubscribe from.
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Handles incoming messages.
   * @param connectionId - The connection ID that received the message.
   * @param messageData - The message data.
   */
  handleMessage(connectionId: string, messageData: any): Promise<void>;
};
