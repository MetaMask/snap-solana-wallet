import type { GetWebSocketsResult } from '@metamask/snaps-sdk';
import type { JsonRpcParams } from '@metamask/utils';
import type {
  AccountInfoBase,
  AccountInfoWithJsonData,
  SolanaRpcResponse,
} from '@solana/kit';

import type { Network } from '../core/constants/solana';

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
};

export type SubscriptionCallbacks = {
  /**
   * A callback that will be called when a notification is received.
   * For instance, if the subscription is for the `accountSubscribe` method, the callback will be called every time the account changes.
   */
  onNotification: (message: any) => Promise<void>;
  /**
   * A callback that will be called when the subscription fails.
   */
  onSubscriptionFailed?: (error: any) => Promise<void>;
  /**
   * A callback that will be called:
   * - when the connection is opened (in case subscription was requested before it was opened).
   * - when the connection is re-opened after it was lost.
   *
   * This is the "message gap recovery", that allows us to compensate for potential missed messages.
   * When a connection is lost unexpectedly, any messages we miss while disconnected can result in the UI falling behind or becoming corrupt.
   * This callback should typically contain an HTTP fetch to catch-up with the latest state.
   *
   * @example
   * ```ts
   * // Connection is open...
   *
   * const service = new SubscriptionService(...);
   * await service.subscribe({method: "accountSubscribe", ...}, {
   *   onConnectionRecovery: async () => {
   *     // Fetch the latest account state from the server.
   *     const account = await fetchAccount(accountAddress);
   *     // Update the state
   *   },
   * });
   *
   * // Connection is lost...
   * // Some changes happen on the account, that are missed while disconnected.
   * // Connection is re-opened...
   * // The onConnectionRecovery is called, ensuring we update the state with the latest account state.
   * // Subscription is re-established, and we receive again the future changes.
   * ```
   */
  onConnectionRecovery?: () => Promise<void>;
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
  address: string,
) => Promise<void>;

export type ProgramNotificationHandler = (
  notification: ProgramNotification,
  programId: string,
  network: Network,
) => Promise<void>;

export type NotificationHandler =
  | AccountNotificationHandler
  | ProgramNotificationHandler;
