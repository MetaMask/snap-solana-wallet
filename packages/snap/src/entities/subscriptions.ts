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

// After we generate our client-side ID
export type PendingSubscription = SubscriptionRequest & {
  readonly id: string; // Our generated UUID
  readonly status: 'pending';
  readonly requestId: string | number; // JSON-RPC request ID
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
