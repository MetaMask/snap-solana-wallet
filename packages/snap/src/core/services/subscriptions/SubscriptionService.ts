/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { WebSocketEvent } from '@metamask/snaps-sdk';
import type { JsonRpcFailure } from '@metamask/utils';
import { isJsonRpcFailure, type JsonRpcRequest } from '@metamask/utils';

import {
  subscribeMethodToUnsubscribeMethod,
  type AccountNotification,
  type NotificationHandler,
  type PendingSubscription,
  type ProgramNotification,
  type SubscribeMethod,
  type SubscriptionConfirmation,
  type SubscriptionRequest,
} from '../../../entities';
import type { EventEmitter } from '../../../infrastructure';
import type { Network } from '../../constants/solana';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { ConfigProvider } from '../config';
import { parseWebSocketMessage } from './parseWebSocketMessage';
import type { SubscriptionRepository } from './SubscriptionRepository';
import type { WebSocketConnectionService } from './WebSocketConnectionService';

/**
 * Allows subscribing / unsubscribing from real-time notifications from the Solana blockchain using the [RPC WebSocket API](https://solana.com/docs/rpc/websocket).
 *
 * @example
 * ```ts
 * const service = new SubscriptionService(...);
 * await service.subscribe(request);
 * await service.unsubscribe(subscriptionId);
 * ```
 */
export class SubscriptionService {
  readonly #connectionService: WebSocketConnectionService;

  readonly #subscriptionRepository: SubscriptionRepository;

  readonly #configProvider: ConfigProvider;

  readonly #eventEmitter: EventEmitter;

  readonly #logger: ILogger;

  // Callbacks that will be called when a notification is received.
  readonly #notificationHandlers: Map<
    SubscribeMethod,
    Map<Network, Set<NotificationHandler>>
  > = new Map();

  constructor(
    connectionService: WebSocketConnectionService,
    subscriptionRepository: SubscriptionRepository,
    configProvider: ConfigProvider,
    eventEmitter: EventEmitter,
    logger: ILogger,
  ) {
    this.#connectionService = connectionService;
    this.#subscriptionRepository = subscriptionRepository;
    this.#configProvider = configProvider;
    this.#eventEmitter = eventEmitter;
    this.#logger = createPrefixedLogger(logger, '[🔔 SubscriptionService]');

    this.#bindHandlers();
  }

  #bindHandlers(): void {
    // When the extension starts, or that the snap is updated / installed, the Snap platform has lost all its previously opened websockets, so we need to re-initialize
    this.#eventEmitter.on('onStart', this.#handleOnStart.bind(this));
    this.#eventEmitter.on('onUpdate', this.#handleOnStart.bind(this));
    this.#eventEmitter.on('onInstall', this.#handleOnStart.bind(this));

    this.#eventEmitter.on(
      'onWebSocketEvent',
      this.#handleWebSocketEvent.bind(this),
    );

    // Specific binds to enable manual testing from the test dapp
    this.#eventEmitter.on(
      'onListSubscriptions',
      this.#listSubscriptions.bind(this),
    );

    /**
     * Register callbacks that will automatically re-subscribe when the connection is reestablished. It covers both cases:
     * - The connection was lost then re-established -> we need to re-subscribe.
     * - The connection was not yet established, and we need to subscribe when it is established.
     */
    const { activeNetworks } = this.#configProvider.get();
    activeNetworks.forEach((network) => {
      this.#connectionService.onConnectionRecovery(
        network,
        this.#reSubscribe.bind(this),
      );
    });
  }

  async #handleOnStart(): Promise<void> {
    this.#logger.info(`Handling onStart/onUpdate/onInstall`);
    await this.#clearSubscriptions();
  }

  registerNotificationHandler(
    method: SubscribeMethod,
    network: Network,
    handler: NotificationHandler,
  ) {
    this.#logger.info(`Registering notification handler`, {
      network,
      method,
      handler,
    });
    if (!this.#notificationHandlers.has(method)) {
      this.#notificationHandlers.set(method, new Map());
    }
    if (!this.#notificationHandlers.get(method)?.has(network)) {
      this.#notificationHandlers.get(method)!.set(network, new Set());
    }
    this.#notificationHandlers.get(method)!.get(network)!.add(handler);
  }

  /**
   * Requests a new subscription.
   * - If the connection is already established, the subscription request is sent immediately.
   * - If the connection is not established, the subscription request is saved and will be sent later, when the connection is established.
   * - It re-subscribes automatically when the connection is re-established.
   *
   * @param request - The subscription request.
   * @returns The ID of the subscription.
   */
  async subscribe(request: SubscriptionRequest): Promise<string> {
    this.#logger.info(`New subscription request`, request);

    const { method, params, network } = request;

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

    // /**
    //  * Register a callback that will send the message when the connection is reestablished. It covers both cases:
    //  * - The connection was lost then re-established -> we need to re-subscribe.
    //  * - The connection was not yet established, and we need to subscribe when it is established.
    //  */
    // this.#connectionService.onConnectionRecovery(network, async () => {
    //   const futureConnectionId =
    //     await this.#connectionService.getConnectionIdByNetwork(network);
    //   if (futureConnectionId) {
    //     await sendSubscriptionMessage(futureConnectionId);
    //   }
    // });

    // If the connection is open, send the message immediately.
    // If not, the subscription will be sent when the connection is reestablished via the #reSubscribe callback.
    if (connectionId) {
      await sendSubscriptionMessage(connectionId);
    }

    return pendingSubscription.id;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    this.#logger.info(`Unsubscribing`, subscriptionId);

    // Attempt to find the subscription in the repository
    const subscription =
      await this.#subscriptionRepository.getById(subscriptionId);

    if (!subscription) {
      this.#logger.warn(`Subscription not found: ${subscriptionId}`);
      return;
    }

    const { id, network, method } = subscription;
    const unsubscribeMethod = subscribeMethodToUnsubscribeMethod[method];

    // If the subscription is active, we need to unsubscribe from the RPC
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
    // We only care about actual messages, not open or close events, which are handled by the connection service.
    if (message.type !== 'message') {
      return;
    }

    const parsedMessage = parseWebSocketMessage(message);
    const connection = await this.#connectionService.getById(message.id);
    if (!connection) {
      return;
    }

    this.#logger.info(`Received message`, message);

    switch (parsedMessage.method) {
      case 'accountNotification':
        await this.#routeAccountNotification(
          parsedMessage as AccountNotification,
          connection.network,
        );
        break;
      case 'programNotification':
        await this.#routeProgramNotification(
          parsedMessage as ProgramNotification,
          connection.network,
        );
        break;
      default:
        // Handle subscription confirmations/errors
        if (this.#isSubscriptionConfirmation(parsedMessage)) {
          await this.#handleSubscriptionConfirmation(parsedMessage);
        } else if (isJsonRpcFailure(parsedMessage)) {
          await this.#handleFailure(parsedMessage);
        } else {
          this.#logger.warn(`Received unknown message`, parsedMessage);
        }
        break;
    }
  }

  async #routeAccountNotification(
    notification: AccountNotification,
    network: Network,
  ): Promise<void> {
    const { subscription: rpcSubscriptionId } = notification.params;

    const subscription = await this.#subscriptionRepository.findBy(
      'rpcSubscriptionId',
      rpcSubscriptionId,
    );
    if (!subscription) {
      this.#logger.warn('No subscription found for RPC ID:', rpcSubscriptionId);
      return;
    }

    const [address] = subscription.params as [string];
    if (!address) {
      this.#logger.warn('No address found for account notification', {
        subscription,
        notification,
      });
      return;
    }

    const handlers = this.#notificationHandlers
      .get('accountSubscribe')
      ?.get(network);
    if (handlers && handlers.size > 0) {
      const results = await Promise.allSettled(
        Array.from(handlers).map(async (handler) =>
          handler(notification, address, network),
        ),
      );

      // Log failures but don't stop other handlers
      results.forEach((item) => {
        if (item.status === 'rejected') {
          this.#logger.error('Account handler failed:', item.reason);
        }
      });
    }
  }

  async #routeProgramNotification(
    notification: ProgramNotification,
    network: Network,
  ): Promise<void> {
    const { subscription: rpcSubscriptionId } = notification.params;

    const subscription = await this.#subscriptionRepository.findBy(
      'rpcSubscriptionId',
      rpcSubscriptionId,
    );
    if (!subscription) {
      return;
    }

    const [programId] = subscription.params as [string];

    const handlers = this.#notificationHandlers
      .get('programSubscribe')
      ?.get(network);
    if (handlers && handlers.size > 0) {
      const results = await Promise.allSettled(
        Array.from(handlers).map(async (handler) =>
          handler(notification, programId, network),
        ),
      );

      // Log failures but don't stop other handlers
      results.forEach((item) => {
        if (item.status === 'rejected') {
          this.#logger.error('Program handler failed:', item.reason);
        }
      });
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
    this.#logger.info(`Sending message to connection ${connectionId}`, message);

    await snap.request({
      method: 'snap_sendWebSocketMessage',
      params: {
        id: connectionId,
        message: JSON.stringify(message),
      },
    });
  }

  /**
   * Checks if the message is a subscription confirmation.
   * @param message - The message to check.
   * @returns True if the message is a subscription confirmation, false otherwise.
   */
  #isSubscriptionConfirmation(
    message: any,
  ): message is SubscriptionConfirmation {
    return (
      'jsonrpc' in message &&
      message.jsonrpc === '2.0' &&
      'id' in message &&
      'result' in message
    );
  }

  async #handleSubscriptionConfirmation(
    message: SubscriptionConfirmation,
  ): Promise<void> {
    const { id: requestId, result: rpcSubscriptionId } = message; // request ID and subscription ID are the same

    const subscription = await this.#subscriptionRepository.getById(
      String(requestId),
    );

    if (!subscription) {
      this.#logger.warn(
        `Received subscription confirmation, but no matching pending subscription found for subscription ID: ${requestId}.`,
      );
      return;
    }

    if (subscription.status === 'confirmed') {
      this.#logger.warn(
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
          `Subscription establishment failed for ${subscription.id}:`,
          response.error,
        );
      } else {
        // Could be an error response to an unsubscribe request or other operation
        this.#logger.error(
          `Received error for request ID: ${response.id}`,
          response.error,
        );
      }
    } else {
      // Connection-level error - doesn't affect individual subscriptions
      this.#logger.error(`Connection-level error:`, response.error);
    }
  }

  async #clearSubscriptions(): Promise<void> {
    this.#logger.info(`Clearing subscriptions`);

    await this.#subscriptionRepository.deleteAll();
  }

  #generateId(): string {
    return globalThis.crypto.randomUUID();
  }

  async #listSubscriptions(): Promise<void> {
    const subscriptions = await this.#subscriptionRepository.getAll();
    this.#logger.info(`Subscriptions`, {
      subscriptions,
      notificationHandlers: this.#notificationHandlers,
    });
  }

  /**
   * Re-subscribes to all subscriptions for the given network.
   * @param network - The network to re-subscribe to.
   */
  async #reSubscribe(network: Network): Promise<void> {
    this.#logger.info(
      `Re-subscribing to all subscriptions for network ${network}`,
    );
    const subscriptions = (await this.#subscriptionRepository.getAll()).filter(
      (subscription) => subscription.network === network,
    );
    await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        await this.subscribe(subscription);
      }),
    );
  }
}
