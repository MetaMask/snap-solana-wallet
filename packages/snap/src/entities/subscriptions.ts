import type { GetWebSocketsResult } from '@metamask/snaps-sdk';
import type { JsonRpcParams } from '@metamask/utils';
import type {
  AccountInfoBase,
  AccountInfoWithJsonData,
  SolanaRpcResponse,
} from '@solana/kit';

import type { Network } from '../core/constants/solana';
import type { Serializable } from '../core/serialization/types';

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
    accountId?: string;
    origin?: string;
    [key: string]: Serializable;
  };
};

export type WebSocketConnection = GetWebSocketsResult[number] & {
  readonly network: Network;
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

// After server confirms the subscription
export type ConfirmedSubscription = Omit<PendingSubscription, 'status'> & {
  readonly status: 'confirmed';
  readonly rpcSubscriptionId: number; // Server's confirmation ID
  readonly confirmedAt: string; // ISO string
};

// Union type for all states
export type Subscription = PendingSubscription | ConfirmedSubscription;

type GetAccountInfoApiResponse<TData> = (AccountInfoBase & TData) | null;

/**
 * A message that we receive from the RPC WebSocket server after subscribing to
 * `accountSubscribe`, notifying us that the account has changed.
 */
export type AccountNotification = {
  jsonrpc: string;
  method: string;
  params: {
    subscription: number;
    result: SolanaRpcResponse<
      GetAccountInfoApiResponse<AccountInfoWithJsonData>
    >;
  };
};

/**
 * A message that we receive from the RPC WebSocket server after subscribing to
 * `programSubscribe`, notifying us that the program has changed.
 */
export type ProgramNotification = {
  jsonrpc: string;
  method: string;
  params: {
    subscription: number;
    result: SolanaRpcResponse<
      GetAccountInfoApiResponse<AccountInfoWithJsonData>
    >;
  };
};

export type SignatureNotification = {
  jsonrpc: string;
  method: string;
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

export type TokenInfo = {
  owner: string;
  mint: string;
  tokenAmount: {
    uiAmountString: string;
  };
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
