/**
 * Represents a subscription to real-time notifications using JSON-RPC.
 *
 * @property id - Caller-provided ID for the subscription.
 * @property method - The method to subscribe to.
 * @property unsubscribeMethod - The method to unsubscribe from.
 * @property params - The parameters to subscribe to.
 * @property onNotification - The callback to be called when a notification is received.
 * @property onSubscriptionFailed - The callback to be called when the subscription could not be created.
 * @property onConnectionRecovery - The callback to be called when the connection is recovered. Typically a fetch to get the latest data.
 */
export type Subscription = {
  id: string;
  method: string;
  unsubscribeMethod: string;
  params: any[];
  onNotification: (notification: any) => Promise<void>;
  onSubscriptionFailed?: (error: any) => Promise<void>;
  onConnectionRecovery?: () => Promise<void>;
};
