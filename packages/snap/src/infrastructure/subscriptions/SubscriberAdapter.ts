import type { JsonRpcFailure } from '@metamask/utils';
import { isJsonRpcFailure, type JsonRpcRequest } from '@metamask/utils';

import type {
  ConnectionManagerPort,
  SubscriberPort,
  SubscriptionCallbacks,
  SubscriptionRequest,
} from '../../core/ports/subscriptions';
import type { ILogger } from '../../core/utils/logger';
import type { SubscriptionRepository } from './SubscriptionRepository';
import type { PendingSubscription } from './types';

/**
 * A message that we receive from the RPC WebSocket server after a subscription request,
 * that confirms that the subscription was successfully established.
 */
type JsonRpcWebSocketSubscriptionConfirmation = {
  jsonrpc: string;
  id: number;
  result: number;
};

/**
 * A message that we receive from the RPC WebSocket server after a subscription is confirmed.
 * It contains the notification data we subscribed to.
 */
type JsonRpcWebSocketNotification = {
  jsonrpc: string;
  method: string;
  params: {
    subscription: number;
    result: any;
  };
};

/**
 * Allows subscribing / unsubscribing from real-time notifications from the Solana blockchain using the [RPC WebSocket API](https://solana.com/docs/rpc/websocket).
 */
export class SubscriberAdapter implements SubscriberPort {
  readonly #connectionManager: ConnectionManagerPort;

  readonly #subscriptionRepository: SubscriptionRepository;

  readonly #logger: ILogger;

  #nextRequestId = 0;

  // TODO: This is problematic because the subscriptions are persisted in the state, but not the callbacks.
  readonly #callbacks: Map<string, SubscriptionCallbacks> = new Map(); // subscription ID -> callbacks

  constructor(
    connectionManager: ConnectionManagerPort,
    subscriptionRepository: SubscriptionRepository,
    logger: ILogger,
  ) {
    this.#connectionManager = connectionManager;
    this.#subscriptionRepository = subscriptionRepository;
    this.#logger = logger;
  }

  /**
   * Requests a new subscription.
   * - If the connection is already established, the subscription request is sent immediately.
   * - If the connection is not established, the subscription request is saved and will be sent later, when the connection is established.
   * - If the subscription has a connection recovery callback, it is registered with the connection manager.
   *
   * @param request - The subscription request.
   * @param callbacks - The callbacks to call when the subscription is established or fails.
   * @returns The ID of the subscription.
   */
  async subscribe(
    request: SubscriptionRequest,
    callbacks: SubscriptionCallbacks,
  ): Promise<string> {
    const { method, params, network } = request;
    const { onConnectionRecovery } = callbacks;

    const pendingSubscription: PendingSubscription = {
      ...request,
      id: globalThis.crypto.randomUUID(),
      status: 'pending',
      requestId: this.#nextRequestId,
      createdAt: new Date().toISOString(),
    };

    this.#nextRequestId += 1;
    const requestId = this.#nextRequestId;

    const message: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params,
    };

    // Before sending the request, save the subscription in the repository.
    // When it gets confirmed, we will update the status to 'active'.
    await this.#subscriptionRepository.save(pendingSubscription);

    this.#callbacks.set(pendingSubscription.id, callbacks);

    // If the subscription has a connection recovery callback, register it with the connection manager.
    if (onConnectionRecovery) {
      this.#connectionManager.onConnectionRecovery(onConnectionRecovery);
    }
    const connectionId =
      this.#connectionManager.getConnectionIdByNetwork(network);

    if (connectionId) {
      // If the connection is already established, send the message immediately.
      await this.#sendMessage(connectionId, message);
    } else {
      // If the connection is not established, register a callback that will send the subscription request when the connection is established.
      this.#connectionManager.onConnectionRecovery(async () => {
        const futureConnectionId =
          this.#connectionManager.getConnectionIdByNetwork(network);

        if (futureConnectionId) {
          await this.#sendMessage(futureConnectionId, message);
        }
      });
    }

    return pendingSubscription.id;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    // Attempt to find the subscription in the repository
    const subscription =
      await this.#subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      this.#logger.warn(
        `[${this.constructor.name}] Subscription not found: ${subscriptionId}`,
      );
      return;
    }

    const { id, network, unsubscribeMethod } = subscription;

    // If the subscription is active, we need to unsubscribe from the RPC and remove it from the active map.
    if (subscription.status === 'confirmed') {
      const connectionId =
        this.#connectionManager.getConnectionIdByNetwork(network);

      if (connectionId) {
        await this.#sendMessage(connectionId, {
          jsonrpc: '2.0',
          id: (this.#nextRequestId += 1),
          method: unsubscribeMethod,
          params: [subscription.rpcSubscriptionId],
        });
      }
    }

    // Whatever the status is, we delete the subscription from the repository.
    await this.#subscriptionRepository.delete(id);
  }

  async handleMessage(connectionId: string, messageData: any): Promise<void> {
    try {
      let parsedMessage: any;

      // Handle SIP-20 message format
      if (
        messageData &&
        typeof messageData === 'object' &&
        'type' in messageData
      ) {
        // This is already a SIP-20 formatted message data
        if (messageData.type === 'text') {
          parsedMessage =
            typeof messageData.message === 'string'
              ? JSON.parse(messageData.message)
              : messageData.message;
        } else if (messageData.type === 'binary') {
          // Convert binary message to string and parse
          const binaryArray = messageData.message as number[];
          const messageString = String.fromCharCode(...binaryArray);
          parsedMessage = JSON.parse(messageString);
        } else {
          this.#logger.warn(
            `[${this.constructor.name}] Unknown message data type:`,
            messageData.type,
          );
          return;
        }
      } else {
        // Fallback for direct message parsing
        parsedMessage =
          typeof messageData === 'string'
            ? JSON.parse(messageData)
            : messageData;
      }

      if (this.#isNotification(parsedMessage)) {
        await this.#handleNotification(parsedMessage);
      } else if (this.#isSubscriptionConfirmation(parsedMessage)) {
        await this.#handleSubscriptionConfirmation(parsedMessage);
      } else if (isJsonRpcFailure(parsedMessage) || 'error' in parsedMessage) {
        await this.#handleFailure(parsedMessage);
      }
    } catch (error) {
      this.#logger.error(
        `[${this.constructor.name}] Failed to handle message:`,
        error,
      );
    }
  }

  /**
   * Sends a message to the WebSocket connection.
   * @param connectionId - The ID of the connection to send the message to.
   * @param message - The message to send.
   * @returns A promise that resolves when the message is sent.
   */
  async #sendMessage(
    connectionId: string,
    message: JsonRpcRequest,
  ): Promise<void> {
    await snap.request({
      method: 'snap_sendWebSocketMessage',
      params: {
        id: connectionId,
        message: JSON.stringify(message),
      },
    });
  }

  /**
   * Checks if the message is a notification.
   * @param message - The message to check.
   * @returns True if the message is a notification, false otherwise.
   */
  #isNotification(message: any): message is JsonRpcWebSocketNotification {
    return (
      'method' in message && message.method !== undefined && 'params' in message
    );
  }

  /**
   * Checks if the message is a subscription confirmation.
   * @param message - The message to check.
   * @returns True if the message is a subscription confirmation, false otherwise.
   */
  #isSubscriptionConfirmation(
    message: any,
  ): message is JsonRpcWebSocketSubscriptionConfirmation {
    return (
      'jsonrpc' in message &&
      message.jsonrpc === '2.0' &&
      'id' in message &&
      'result' in message
    );
  }

  async #handleNotification(
    notification: JsonRpcWebSocketNotification,
  ): Promise<void> {
    const { subscription: rpcSubscriptionId, result } = notification.params;

    const subscription =
      await this.#subscriptionRepository.findByRpcSubscriptionId(
        rpcSubscriptionId,
      );

    if (!subscription) {
      this.#logger.warn(
        `[${this.constructor.name}] Received a notification, but no matching active subscription found for RPC ID: ${rpcSubscriptionId}. It might be still pending confirmation.`,
      );

      return;
    }

    try {
      const callbacks = this.#callbacks.get(subscription.id);

      if (callbacks?.onNotification) {
        await callbacks.onNotification(result);
      }
    } catch (error) {
      this.#logger.error(
        `[${this.constructor.name}] Error in subscription callback for ${rpcSubscriptionId}:`,
        error,
      );
    }
  }

  async #handleSubscriptionConfirmation(
    message: JsonRpcWebSocketSubscriptionConfirmation,
  ): Promise<void> {
    const requestId = message.id;
    const rpcSubscriptionId = message.result;
    const subscription =
      await this.#subscriptionRepository.findByRequestId(requestId);

    if (!subscription) {
      this.#logger.warn(
        `[${this.constructor.name}] Received subscription confirmation, but no matching pending subscription found for request ID: ${requestId}.`,
      );
      return;
    }

    if (subscription.status === 'confirmed') {
      this.#logger.warn(
        `[${this.constructor.name}] Received subscription confirmation, but the subscription is already confirmed for request ID: ${requestId}.`,
      );
      return;
    }

    await this.#subscriptionRepository.update({
      ...subscription,
      status: 'confirmed',
      rpcSubscriptionId,
      confirmedAt: new Date().toISOString(),
    });

    this.#logger.info(
      `[${this.constructor.name}] Subscription confirmed: request ID: ${requestId} -> RPC ID: ${rpcSubscriptionId}`,
    );
  }

  /**
   * Handles the various types of WebSocket error messages.
   *
   * 1. Subscription Establishment Errors, when the initial subscription request fails:
   *
   * ```json
   * // We sent: {"jsonrpc":"2.0","id":123,"method":"accountSubscribe","params":[...]}
   * // Server responds with error:
   * {
   *   "jsonrpc": "2.0",
   *   "error": {
   *     "code": -32602,
   *     "message": "Invalid params: account not found"
   *   },
   *   "id": 123  // Same ID as our subscription request
   * }
   * ```
   * This means the subscription was never established → We should clean up from #pendingSubscriptions.
   *
   * 2. Individual Notification Errors. After a subscription is established, individual notifications might have errors:
   *
   * ```json
   * // Normal notification:
   * {
   *   "jsonrpc": "2.0",
   *   "method": "accountNotification",
   *   "params": {
   *     "subscription": 98765,
   *     "result": {"error": "Temporary RPC node issue"}
   *   }
   * }
   * ```
   * The subscription is still valid → Keep it active, just log the error.
   *
   * 3. Connection-Level Errors (No specific cleanup)
   * ```json
   * {
   *   "jsonrpc": "2.0",
   *   "error": {
   *     "code": -32700,
   *     "message": "Parse error"
   *   }
   *   // No "id" field
   * }
   * ```
   *
   * @param response - The response to handle.
   */
  async #handleFailure(response: JsonRpcFailure): Promise<void> {
    if (
      'id' in response &&
      response.id !== undefined &&
      typeof response.id === 'number'
    ) {
      // This is a response to a specific subscription request, expect the error to be related to a pending subscription.
      const subscription = await this.#subscriptionRepository.findByRequestId(
        response.id,
      );

      if (subscription?.status === 'pending') {
        // The subscription request failed. We can remove it from the repository.
        await this.#subscriptionRepository.delete(subscription.id);

        this.#logger.error(
          `[${this.constructor.name}] Subscription establishment failed for ${subscription.id}:`,
          response.error,
        );

        const callbacks = this.#callbacks.get(subscription.id);

        // Optionally call an onSubscriptionFailed callback if the subscription has one
        if (callbacks?.onSubscriptionFailed) {
          try {
            await callbacks.onSubscriptionFailed(response.error);
          } catch (callbackError) {
            this.#logger.error(
              'Error in subscription error callback:',
              callbackError,
            );
          }
        }
      } else {
        // Could be an error response to an unsubscribe request or other operation
        this.#logger.error(
          `[${this.constructor.name}] Received error for request ID: ${response.id}`,
          response.error,
        );
      }
    } else {
      // Connection-level error - doesn't affect individual subscriptions
      this.#logger.error(
        `[${this.constructor.name}] Connection-level error:`,
        response.error,
      );
    }
  }

  //   async #handleConnection(
  //     connectionId: string,
  //     event: 'connect',
  //   ): Promise<void> {
  //     this.#logger.info(
  //       `[${this.constructor.name}] Handling connection event: ${event} for ${connectionId}`,
  //     );

  //     /**
  //      * Note that this happens for ALL 'connect' events: the initial one as well as subsequent ones after a disconnection.
  //      * This also allows for requesting subscriptions BEFORE the initial connection is even established, preventing potential startup race conditions.
  //      */
  //     await this.#recoverSubscriptions(connectionId);
  //   }

  /**
   * TODO: I think we don't need this.
   * Re-establishes all subscriptions.
   * @param connectionId - The ID of the connection to recover the subscriptions for.
   */
  async #recoverSubscriptions(connectionId: string): Promise<void> {
    this.#logger.info(
      `[${this.constructor.name}] Recovering subscriptions after reconnection`,
    );

    // Collect all subscriptions that need to be re-established
    const subscriptions = await this.#subscriptionRepository.getAll();

    // Re-establish all subscriptions
    const recoveryPromises = subscriptions.map(async (subscription) => {
      try {
        const callbacks = this.#callbacks.get(subscription.id);

        if (!callbacks) {
          throw new Error(
            `No callbacks found for subscription ${subscription.id}`,
          );
        }

        await this.subscribe(subscription, callbacks);

        return { status: 'fulfilled', subscription };
      } catch (error) {
        this.#logger.error(
          `[${this.constructor.name}] Failed to recover subscription ${subscription.id}:`,
          error,
        );
        return { status: 'rejected', subscription, error };
      }
    });

    const results = await Promise.allSettled(recoveryPromises);

    // Log summary
    const successful = results.filter(
      (item) => item.status === 'fulfilled' && item.value.subscription,
    ).length;

    this.#logger.info(
      `[${this.constructor.name}] Recovery complete: ${successful}/${subscriptions.length} subscriptions recovered`,
    );

    // // Clear existing state since all subscriptions are now invalid
    // this.#activeSubscriptions.clear();
    // this.#subscriptionIdsLookup.clear();
    // this.#pendingSubscriptions.clear();

    // TODO: DO THIS BEFORE RECOVERING SUBSCRIPTIONS???
    // Call recovery callbacks
    // for (const callback of this.#connectionRecoveryCallbacks) {
    //   try {
    //     await callback();
    //   } catch (error) {
    //     this.#logger.error(
    //       '[WebSocketJsonRpcSubscriptionAdapter] Error in connection recovery callback:',
    //       error,
    //     );
    //   }
    // }
  }
}
