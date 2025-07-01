import type { GetWebSocketsResult } from '@metamask/snaps-sdk';
import type { JsonRpcParams } from '@metamask/utils';

import type { Network } from '../core/constants/solana';

/**
 * A request to subscribe to a JSON-RPC subscription.
 */
export type SubscriptionRequest = {
  method: string;
  unsubscribeMethod: string;
  params: JsonRpcParams;
  network: Network;
};

export type Connection = GetWebSocketsResult[number];

/**
 * Once the Subscriber acknowledges the subscription request,
 * it generates a subscrption ID, and the subscription is pending (waiting for the confirmation message).
 */
export type PendingSubscription = SubscriptionRequest & {
  readonly id: string;
  readonly status: 'pending';
  readonly requestId: string; // Same a the field `id`
  readonly createdAt: string; // ISO string
};

// After server confirms the subscription
export type ConfirmedSubscription = Omit<PendingSubscription, 'status'> & {
  readonly status: 'confirmed';
  readonly rpcSubscriptionId: number; // Server's confirmation ID
  readonly confirmedAt: string; // ISO string
};

// Union type for all states
export type Subscription = PendingSubscription | ConfirmedSubscription;
