import type { Subscription } from '../../../entities';

/**
 * Port interface for JSON-RPC subscription operations.
 *
 * Defines the contract for managing WebSocket-based JSON-RPC subscriptions,
 * with subscription lifecycle management and message handling.
 */
export type SubscriptionManagerPort = {
  /**
   * Subscribes to a specific method.
   * @param connectionId - The connection ID to subscribe to.
   * @param subscription - The subscription parameters.
   */
  subscribe(connectionId: string, subscription: Subscription): Promise<void>;

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
