import type { JsonRpcParams } from '@metamask/utils';

import type { Network } from '../../constants/solana';

/**
 * A request to subscribe to a JSON-RPC subscription.
 */
export type SubscriptionRequest = {
  method: string;
  unsubscribeMethod: string;
  params: JsonRpcParams;
  network: Network;
};

export type SubscriptionCallbacks = {
  onNotification: (message: any) => Promise<void>;
  onSubscriptionFailed?: (error: any) => Promise<void>;
  onConnectionRecovery?: () => Promise<void>;
};

/**
 * A port for subscribing / unsubscribing to JSON-RPC subscriptions.
 */
export type SubscriberPort = {
  /**
   * Subscribes to a JSON-RPC subscription.
   * @param request - The subscription request.
   * @param onNotification - The callback to be called when a notification is received.
   * @returns The subscription ID.
   */
  subscribe(
    request: SubscriptionRequest,
    callbacks: {
      onNotification: (message: any) => Promise<void>;
      onSubscriptionFailed?: (error: any) => Promise<void>;
      onConnectionRecovery?: () => Promise<void>;
    },
  ): Promise<string>;

  /**
   * Unsubscribes from a JSON-RPC subscription.
   * @param subscriptionId - The subscription ID.
   */
  unsubscribe(subscriptionId: string): Promise<void>;
};
