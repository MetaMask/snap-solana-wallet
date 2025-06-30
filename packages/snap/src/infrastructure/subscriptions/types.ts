import type { GetWebSocketsResult } from '@metamask/snaps-sdk';

import type { SubscriptionRequest } from '../../core/ports/subscriptions';

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
