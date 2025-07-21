import type { GetWebSocketsResult } from '@metamask/snaps-sdk';
import type { JsonRpcParams } from '@metamask/utils';
import type { SolanaRpcResponse } from '@solana/kit';

import type { Network } from '../core/constants/solana';
import type { Serializable } from '../core/serialization/types';

export type WebSocketConnection = GetWebSocketsResult[number] & {
  readonly network: Network;
};

export type SubscribeMethod =
  | 'accountSubscribe'
  | 'programSubscribe'
  | 'signatureSubscribe';

export const subscribeMethodToUnsubscribeMethod: Record<
  SubscribeMethod,
  string
> = {
  accountSubscribe: 'accountUnsubscribe',
  programSubscribe: 'programUnsubscribe',
  signatureSubscribe: 'signatureUnsubscribe',
};

/**
 * A request to subscribe to a JSON-RPC subscription.
 */
export type SubscriptionRequest = {
  method: SubscribeMethod;
  params: JsonRpcParams;
  network: Network;
  metadata?: {
    [key: string]: Serializable;
  };
};

/**
 * Once the Subscriber acknowledges the subscription request,
 * it generates a subscription ID, and the subscription is pending (waiting for the confirmation message).
 */
export type PendingSubscription = SubscriptionRequest & {
  readonly id: string;
  readonly status: 'pending';
  readonly requestId: string; // Same a the field `id`
  readonly createdAt: string; // ISO string
};

/**
 * A message that we receive from the RPC WebSocket server after a subscription request,
 * that confirms that the subscription was successfully established.
 */
export type SubscriptionConfirmation = {
  jsonrpc: string;
  id: string | number;
  result: number;
};

// After server confirms the subscription
export type ConfirmedSubscription = Omit<PendingSubscription, 'status'> & {
  readonly status: 'confirmed';
  readonly rpcSubscriptionId: number; // Server's confirmation ID
  readonly confirmedAt: string; // ISO string
};

// Union type for all states
export type Subscription = PendingSubscription | ConfirmedSubscription;

/**
 * A message that we receive from the RPC WebSocket server after subscribing to
 * `accountSubscribe`, notifying us that the account has changed.
 */
export type AccountNotification = {
  jsonrpc: string;
  method: 'accountNotification';
  params: {
    subscription: number;
    result: {
      context: {
        slot: number;
      };
      value: {
        data: object;
        executable: boolean;
        lamports: number;
        owner: string;
        rentEpoch: number | null;
      };
    };
  };
};

/**
 * A message that we receive from the RPC WebSocket server after subscribing to
 * `programSubscribe`, notifying us that the program has changed.
 */
export type ProgramNotification = {
  jsonrpc: string;
  method: 'programNotification';
  params: {
    subscription: number;
    result: {
      context: {
        slot: number;
      };
      value: {
        pubkey: string;
        account: {
          data: {
            parsed: {
              info: {
                isNative: boolean;
                mint: string;
                owner: string;
                state: string;
                tokenAmount: {
                  amount: string;
                  decimals: number;
                  uiAmount: number;
                  uiAmountString: string;
                };
              };
              type: string;
            };
            program: string;
            space: number;
          };
          executable: boolean;
          lamports: number;
          owner: string;
          rentEpoch: number | null;
        };
      };
    };
  };
};

export type SignatureNotification = {
  jsonrpc: string;
  method: 'signatureNotification';
  params: {
    subscription: number;
    result: SolanaRpcResponse<{
      // eslint-disable-next-line id-denylist
      err: null | object;
    }>;
  };
};

export type Notification =
  | AccountNotification
  | ProgramNotification
  | SignatureNotification;

export type AccountNotificationHandler = (
  notification: AccountNotification,
  subscription: Subscription,
) => Promise<void>;

export type ProgramNotificationHandler = (
  notification: ProgramNotification,
  subscription: Subscription,
) => Promise<void>;

export type SignatureNotificationHandler = (
  notification: SignatureNotification,
  subscription: Subscription,
) => Promise<void>;

/**
 * A callback that will be called when a notification is received.
 * For instance, if the subscription is for the `accountSubscribe` method, and we receive a `accountNotification`, the callback will be called.
 */
export type NotificationHandler =
  | AccountNotificationHandler
  | ProgramNotificationHandler
  | SignatureNotificationHandler;

export type ConnectionRecoveryHandler = (network: Network) => Promise<void>;
