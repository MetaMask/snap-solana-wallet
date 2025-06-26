import type { JsonRpcFailure } from '@metamask/utils';
import { isJsonRpcFailure, type JsonRpcRequest } from '@metamask/utils';

import { Network } from '../../core/constants/solana';
import type {
  ConnectionManagerPort,
  SubscriptionManagerPort,
} from '../../core/ports/subscriptions';
import type { ILogger } from '../../core/utils/logger';
import type { Subscription } from '../../entities';

type JsonRpcWebSocketSubscriptionConfirmation = {
  jsonrpc: string;
  id: number;
  result: number;
};

/**
 * A notification message from the RPC WebSocket server.
 * Notifications are messages that are sent by the RPC WebSocket server to the client after a subscription is established.
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
 * Implements JSON-RPC subscription transport over WebSocket.
 *
 * Allows subscribing to real-time notifications from the Solana blockchain using the [RPC WebSocket API](https://solana.com/docs/rpc/websocket).
 * Manages connection lifecycle, subscriptions, and message routing.
 *
 * A typical flow is as follows:
 *
 * > wscat -c wss://solana-mainnet.infura.io/ws/v3/xyz  // Open the connection
 * > Send {"jsonrpc":"2.0","id":12345,"method":"accountSubscribe","params":["LUKAzPV8dDbVykTVT14pCGKzFfNcgZgRbAXB8AGdKx3",{"commitment": "confirmed"}]} // Request a subscription. At this point, we store it the pending map, indexed by the request ID (field "id" in the request).
 * > Receive {"jsonrpc":"2.0","result":98765,"id":12345} // Subscription confirmed. At this point, we move it to the active map, indexed by the RPC subscription ID (field "result" in the response).
 * > Receive {"jsonrpc":"2.0","method":"accountNotification","params":{"subscription":98765,"result":{"context":{"Slot":348893275},"value":{"lamports":116044436802,"owner":"11111111111111111111111111111111","data":null,"executable":false,"rentEpoch":null}}}} // Notification received.
 * > Receive {"jsonrpc":"2.0","method":"accountNotification","params":{"subscription":98765,"result":{"context":{"Slot":348848975},"value":{"lamports":117046295673,"owner":"11111111111111111111111111111111","data":null,"executable":false,"rentEpoch":null}}}} // Notification received.
 * ...
 */
export class SubscriptionManagerAdapter implements SubscriptionManagerPort {
  readonly #logger: ILogger;

  readonly #connectionManager: ConnectionManagerPort;

  // TODO: Need to track in the state
  readonly #pendingSubscriptions: Map<number, Subscription> = new Map(); // request ID -> subscription

  readonly #activeSubscriptions: Map<number, Subscription> = new Map(); // RPC subscription ID -> subscription

  readonly #subscriptionIdsLookup: Map<number, number> = new Map(); // RPC subscription ID -> request ID

  #nextRequestId = 1;

  constructor(
    subscriptionConnectionManager: ConnectionManagerPort,
    logger: ILogger,
  ) {
    this.#connectionManager = subscriptionConnectionManager;
    this.#logger = logger;
  }

  async subscribe(
    connectionId: string,
    subscriptionRequest: Subscription,
  ): Promise<void> {
    const { method, params, onConnectionRecovery } = subscriptionRequest;

    this.#nextRequestId += 1;
    const requestId = this.#nextRequestId;

    const message: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params,
    };

    // Before sending the request, register the subscription in the pending list.
    // When it gets confirmed, we will move it to the active list.
    this.#pendingSubscriptions.set(requestId, subscriptionRequest);

    // If the subscription has a connection recovery callback, register it with the connection manager.
    if (onConnectionRecovery) {
      this.#connectionManager.onConnectionRecovery(onConnectionRecovery);
    }

    await this.#sendMessage(connectionId, message);
  }

  async unsubscribe(callerSubscriptionId: string): Promise<void> {
    // Search for the subscription in the active map
    const [rpcSubscriptionId, subscriptionInActiveMap] =
      Array.from(this.#activeSubscriptions.entries()).find(
        ([key, value]) => value.id === callerSubscriptionId,
      ) ?? [];

    // If the subscription is active, we need to unsubscribe from the RPC and remove it from the active map.
    if (rpcSubscriptionId && subscriptionInActiveMap) {
      const network = this.#getNetworkFromSubscription(subscriptionInActiveMap);
      const connectionId =
        this.#connectionManager.getConnectionIdByNetwork(network);

      if (connectionId) {
        const { unsubscribeMethod } = subscriptionInActiveMap;

        await this.#sendMessage(connectionId, {
          jsonrpc: '2.0',
          id: (this.#nextRequestId += 1),
          method: unsubscribeMethod,
          params: [rpcSubscriptionId],
        });
      }

      if (rpcSubscriptionId !== undefined) {
        this.#subscriptionIdsLookup.delete(rpcSubscriptionId);
      }
    } else {
      // If not found in the active map, search for the subscription in the pending map
      const [requestId, subscriptionInPendingMap] =
        Array.from(this.#pendingSubscriptions.entries()).find(
          ([key, value]) => value.id === callerSubscriptionId,
        ) ?? [];

      // If it was found in the pending map, we simply need to remove it from the map.
      if (requestId) {
        this.#pendingSubscriptions.delete(requestId);
      }
    }

    this.#logger.info(
      `[${this.constructor.name}] Unsubscribed: ${callerSubscriptionId}`,
    );
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
        this.#handleSubscriptionConfirmation(parsedMessage);
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

    const subscription = this.#activeSubscriptions.get(rpcSubscriptionId);

    if (!subscription) {
      this.#logger.warn(
        `[${this.constructor.name}] Received a notification, but no matching active subscription found for RPC ID: ${rpcSubscriptionId}`,
      );

      if (this.#subscriptionIdsLookup.has(rpcSubscriptionId)) {
        this.#logger.warn(
          `[${this.constructor.name}] Subscription is still pending for RPC ID: ${rpcSubscriptionId}`,
        );
      }

      return;
    }

    try {
      await subscription.onNotification(result);
    } catch (error) {
      this.#logger.error(
        `[${this.constructor.name}] Error in subscription callback for ${rpcSubscriptionId}:`,
        error,
      );
    }
  }

  #handleSubscriptionConfirmation(
    message: JsonRpcWebSocketSubscriptionConfirmation,
  ): void {
    const requestId = message.id;
    const rpcSubscriptionId = message.result;
    const subscription = this.#pendingSubscriptions.get(requestId);

    if (subscription) {
      // Populate the lookup table
      this.#subscriptionIdsLookup.set(rpcSubscriptionId, requestId);

      // Add the subscription to the active list
      this.#activeSubscriptions.set(rpcSubscriptionId, subscription);

      // Clean up pending subscription tracking
      this.#pendingSubscriptions.delete(requestId);

      this.#logger.info(
        `[${this.constructor.name}] Subscription confirmed: request ID: ${requestId} -> RPC ID: ${rpcSubscriptionId}`,
      );
    } else {
      this.#logger.warn(
        `[${this.constructor.name}] Received confirmation for unknown request ID: ${requestId}`,
      );
    }
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
      // This is a response to a specific request. The only JSON-RPC requests we send are subscription requests, so the error is related to a subscription.
      const subscription = this.#pendingSubscriptions.get(response.id);

      if (subscription) {
        // The subscription request itself failed. We remove it from the pending list.
        this.#pendingSubscriptions.delete(response.id);

        this.#logger.error(
          `[${this.constructor.name}] Subscription establishment failed for ${subscription.id}:`,
          response.error,
        );

        // Optionally call an onSubscriptionFailed callback if the subscription has one
        if (subscription.onSubscriptionFailed) {
          try {
            await subscription.onSubscriptionFailed(response.error);
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
    const subscriptionsToRecover = [
      ...this.#pendingSubscriptions.values(),
      ...this.#activeSubscriptions.values(),
    ];

    // Clear existing state since all subscriptions are now invalid
    this.#activeSubscriptions.clear();
    this.#subscriptionIdsLookup.clear();
    this.#pendingSubscriptions.clear();

    // Re-establish all subscriptions
    const recoveryPromises = subscriptionsToRecover.map(
      async (subscription) => {
        try {
          await this.subscribe(connectionId, subscription);
          return { status: 'fulfilled', subscription };
        } catch (error) {
          this.#logger.error(
            `[${this.constructor.name}] Failed to recover subscription ${subscription.id}:`,
            error,
          );
          return { status: 'rejected', subscription, error };
        }
      },
    );

    const results = await Promise.allSettled(recoveryPromises);

    // Log summary
    const successful = results.filter(
      (item) => item.status === 'fulfilled' && item.value.subscription,
    ).length;

    this.#logger.info(
      `[${this.constructor.name}] Recovery complete: ${successful}/${subscriptionsToRecover.length} subscriptions recovered`,
    );

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

  #getNetworkFromSubscription(subscription: Subscription): Network {
    // This is a simplified approach - you might need a better way to determine the network
    // based on your specific implementation
    return Network.Mainnet; // Default to mainnet for now
  }
}
