import type { WebSocketEvent } from '@metamask/snaps-sdk';
import type { JsonRpcFailure } from '@metamask/utils';
import { isJsonRpcFailure, type JsonRpcRequest } from '@metamask/utils';

import type {
  PendingSubscription,
  SubscriptionCallbacks,
  SubscriptionRequest,
} from '../../../entities';
import type { EventEmitter } from '../../../infrastructure';
import { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { SubscriptionRepository } from './SubscriptionRepository';
import type { WebSocketConnectionService } from './WebSocketConnectionService';

/**
 * A message that we receive from the RPC WebSocket server after a subscription request,
 * that confirms that the subscription was successfully established.
 */
type JsonRpcWebSocketSubscriptionConfirmation = {
  jsonrpc: string;
  id: string | number;
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
 *
 * @example
 * ```ts
 * const service = new SubscriptionService(...);
 * await service.subscribe(request, callbacks);
 * await service.unsubscribe(subscriptionId);
 * ```
 */
export class SubscriptionService {
  readonly #connectionService: WebSocketConnectionService;

  readonly #subscriptionRepository: SubscriptionRepository;

  readonly #logger: ILogger;

  readonly loggerPrefix = '[🔔 SubscriptionService]';

  // TODO: This is problematic because the subscriptions are persisted in the state, but not the callbacks.
  readonly #callbacks: Map<string, SubscriptionCallbacks> = new Map(); // subscription ID -> callbacks

  constructor(
    connectionService: WebSocketConnectionService,
    subscriptionRepository: SubscriptionRepository,
    eventEmitter: EventEmitter,
    logger: ILogger,
  ) {
    this.#connectionService = connectionService;
    this.#subscriptionRepository = subscriptionRepository;
    this.#logger = logger;

    // When the extension starts, it has lost all its websockets, so we need to clear the subscriptions.
    eventEmitter.on('onStart', this.#clearSubscriptions.bind(this));
    eventEmitter.on('onWebSocketEvent', this.#handleWebSocketEvent.bind(this));

    // Temporary bind to enable manual testing from the test dapp
    eventEmitter.on(
      'onTestSubscribeToAccount',
      this.#testSubscribeToAccount.bind(this),
    );
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
    this.#logger.info(
      this.loggerPrefix,
      `New subscription request`,
      request,
      callbacks,
    );

    const { method, params, network } = request;
    const { onConnectionRecovery } = callbacks;

    const id = this.#generateId();

    const pendingSubscription: PendingSubscription = {
      ...request,
      id,
      status: 'pending',
      requestId: id, // Use the same ID for the request and the subscription for easier lookup.
      createdAt: new Date().toISOString(),
    };

    // Before sending the request, save the subscription in the repository.
    // When it gets confirmed, we will update the status to 'active'.
    await this.#subscriptionRepository.save(pendingSubscription);

    this.#callbacks.set(id, callbacks);

    // If the subscription has a connection recovery callback, register it with the connection manager.
    if (onConnectionRecovery) {
      this.#connectionService.onConnectionRecovery(
        network,
        onConnectionRecovery,
      );
    }

    const connectionId =
      await this.#connectionService.getConnectionIdByNetwork(network);

    const sendSubscriptionMessage = async (_connectionId: string) => {
      const message: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };
      if (_connectionId) {
        await this.#sendMessage(_connectionId, message);
      }
    };

    /**
     * Register a callback that will send the message when the connection is reestablished. It covers both cases:
     * - The connection was lost then re-established -> we need to re-subscribe.
     * - The connection was not yet established, and we need to re-subscribe when it is established.
     */
    this.#connectionService.onConnectionRecovery(network, async () => {
      const futureConnectionId =
        await this.#connectionService.getConnectionIdByNetwork(network);
      if (futureConnectionId) {
        await sendSubscriptionMessage(futureConnectionId);
      }
    });

    // If the connection is open, send the message immediately.
    if (connectionId) {
      await sendSubscriptionMessage(connectionId);
    }

    return pendingSubscription.id;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    this.#logger.info(this.loggerPrefix, `Unsubscribing`, subscriptionId);

    // Attempt to find the subscription in the repository
    const subscription =
      await this.#subscriptionRepository.getById(subscriptionId);

    if (!subscription) {
      this.#logger.warn(
        this.loggerPrefix,
        `Subscription not found: ${subscriptionId}`,
      );
      return;
    }

    const { id, network, unsubscribeMethod } = subscription;

    // If the subscription is active, we need to unsubscribe from the RPC and remove it from the active map.
    if (subscription.status === 'confirmed') {
      const connectionId =
        await this.#connectionService.getConnectionIdByNetwork(network);

      if (connectionId) {
        await this.#sendMessage(connectionId, {
          jsonrpc: '2.0',
          id: this.#generateId(),
          method: unsubscribeMethod,
          params: [subscription.rpcSubscriptionId],
        });
      }
    }

    // Whatever the status is, we delete the subscription from the repository.
    await this.#subscriptionRepository.delete(id);
  }

  async #handleWebSocketEvent(message: WebSocketEvent): Promise<void> {
    // We only care about actual messages, not open or close events.
    if (message.type !== 'message') {
      return;
    }

    this.#logger.info(this.loggerPrefix, `Received message`, message);

    try {
      const { data } = message;
      let parsedMessage: any;

      // Handle SIP-20 message format
      if (data && typeof data === 'object' && 'type' in data) {
        // This is already a SIP-20 formatted message data
        if (data.type === 'text') {
          parsedMessage =
            typeof data.message === 'string'
              ? JSON.parse(data.message)
              : data.message;
        } else if (data.type === 'binary') {
          // Convert binary message to string and parse
          const binaryArray = data.message;
          const messageString = String.fromCharCode(...binaryArray);
          parsedMessage = JSON.parse(messageString);
        } else {
          this.#logger.warn(this.loggerPrefix, `Unknown message data`, data);
          return;
        }
      } else {
        // Fallback for direct message parsing
        parsedMessage = typeof data === 'string' ? JSON.parse(data) : data;
      }

      if (this.#isNotification(parsedMessage)) {
        await this.#handleNotification(parsedMessage);
      } else if (this.#isSubscriptionConfirmation(parsedMessage)) {
        await this.#handleSubscriptionConfirmation(parsedMessage);
      } else if (isJsonRpcFailure(parsedMessage) || 'error' in parsedMessage) {
        await this.#handleFailure(parsedMessage);
      }
    } catch (error) {
      this.#logger.error(this.loggerPrefix, `Failed to handle message`, error);
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
    this.#logger.info(
      this.loggerPrefix,
      `Sending message to connection ${connectionId}`,
      message,
    );

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

    const subscription = await this.#subscriptionRepository.findBy(
      'rpcSubscriptionId',
      rpcSubscriptionId,
    );

    if (!subscription) {
      this.#logger.warn(
        this.loggerPrefix,
        `Received a notification, but no matching confirmed subscription found for RPC subscription ID: ${rpcSubscriptionId}.`,
      );

      return;
    }

    try {
      const callbacks = this.#callbacks.get(subscription.id);
      if (!callbacks) {
        this.#logger.warn(
          this.loggerPrefix,
          `Received a notification, but no matching callbacks found for subscription ID: ${subscription.id}.`,
        );
        return;
      }

      await callbacks.onNotification(result);
    } catch (error) {
      this.#logger.error(
        this.loggerPrefix,
        `Error in subscription callback for ${rpcSubscriptionId}:`,
        error,
      );
    }
  }

  async #handleSubscriptionConfirmation(
    message: JsonRpcWebSocketSubscriptionConfirmation,
  ): Promise<void> {
    const { id: requestId, result: rpcSubscriptionId } = message; // request ID and subscription ID are the same

    const subscription = await this.#subscriptionRepository.getById(
      String(requestId),
    );

    if (!subscription) {
      this.#logger.warn(
        this.loggerPrefix,
        `Received subscription confirmation, but no matching pending subscription found for subscription ID: ${requestId}.`,
      );
      return;
    }

    if (subscription.status === 'confirmed') {
      this.#logger.warn(
        this.loggerPrefix,
        `Received subscription confirmation, but the subscription is already confirmed for request ID: ${requestId}.`,
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
      this.loggerPrefix,
      `Subscription confirmed: request ID: ${requestId} -> RPC ID: ${rpcSubscriptionId}`,
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
    if ('id' in response && response.id !== undefined) {
      // This is a response to a specific subscription request, expect the error to be related to a pending subscription.
      const subscription = await this.#subscriptionRepository.getById(
        String(response.id),
      );

      if (subscription?.status === 'pending') {
        // The subscription request failed. We can remove the pending subscription from the repository.
        await this.#subscriptionRepository.delete(subscription.id);

        this.#logger.error(
          this.loggerPrefix,
          `Subscription establishment failed for ${subscription.id}:`,
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
          this.loggerPrefix,
          `Received error for request ID: ${response.id}`,
          response.error,
        );
      }
    } else {
      // Connection-level error - doesn't affect individual subscriptions
      this.#logger.error(
        this.loggerPrefix,
        `Connection-level error:`,
        response.error,
      );
    }
  }

  async #clearSubscriptions(): Promise<void> {
    this.#logger.info(this.loggerPrefix, `Clearing subscriptions`);
    await this.#subscriptionRepository.deleteAll();
  }

  /**
   * DELETE: Temporary method to test a subscription.
   */
  async #testSubscribeToAccount(): Promise<void> {
    const subscriptionRequest: SubscriptionRequest = {
      method: 'accountSubscribe',
      unsubscribeMethod: 'accountUnsubscribe',
      network: Network.Mainnet,
      params: [
        '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC', // LUKAzPV8dDbVykTVT14pCGKzFfNcgZgRbAXB8AGdKx3
        { commitment: 'confirmed' },
      ],
    };

    this.#logger.info(
      this.loggerPrefix,
      `Testing subscription`,
      subscriptionRequest,
    );

    const callbacks: SubscriptionCallbacks = {
      onNotification: async (message: any) => {
        this.#logger.info(this.loggerPrefix, `onNotification`, message);
      },
      onSubscriptionFailed: async (error: any) => {
        this.#logger.info(this.loggerPrefix, `onSubscriptionFailed`, error);
      },
      onConnectionRecovery: async () => {
        this.#logger.info(this.loggerPrefix, `onConnectionRecovery`);
      },
    };

    await this.subscribe(subscriptionRequest, callbacks);
  }

  #generateId(): string {
    return globalThis.crypto.randomUUID();
  }
}
