import { Network } from '../../core/constants/solana';
import type {
  WebSocketSubscription,
  WebSocketTransportPort,
} from '../../core/ports/WebSocketTransportPort';
import type { ConfigProvider } from '../../core/services/config/ConfigProvider';
import type { ILogger } from '../../core/utils/logger';

export type WebSocketMessage = {
  jsonrpc: string;
  id?: number | string;
  method?: string;
  params?: any[];
  result?: any;
  error?: any;
};

export type WebSocketNotification = {
  jsonrpc: string;
  method: string;
  params: {
    subscription: number;
    result: any;
  };
};

/**
 * WebSocket transport for handling Solana RPC WebSocket connections.
 * Manages connection lifecycle, subscriptions, and message routing.
 */
export class WebSocketTransport implements WebSocketTransportPort {
  readonly #configProvider: ConfigProvider;

  readonly #logger: ILogger;

  readonly #networkConnections: Map<Network, string> = new Map(); // network -> connection ID

  readonly #subscriptions: Map<string, WebSocketSubscription> = new Map(); // subscription ID -> subscription

  readonly #rpcSubscriptions: Map<number, string> = new Map(); // RPC subscription ID -> our subscription ID

  #nextRequestId = 1;

  #isConnected = false;

  #reconnectAttempts = 0;

  #maxReconnectAttempts = 5;

  #reconnectDelay = 1000; // Start with 1 second

  #connectionRecoveryCallbacks: (() => Promise<void>)[] = [];

  constructor(configProvider: ConfigProvider, logger: ILogger) {
    this.#configProvider = configProvider;
    this.#logger = logger;
  }

  /**
   * Opens a WebSocket connection for the specified network.
   * @param network - The network to open a connection for.
   * @returns A promise that resolves to the connection ID.
   */
  async openConnection(network: Network): Promise<string> {
    try {
      const networkConfig = this.#configProvider.getNetworkBy(
        'caip2Id',
        network,
      );
      const rpcUrl = networkConfig.rpcUrls[0];

      if (!rpcUrl) {
        throw new Error(`No RPC URL found for network ${network}`);
      }

      const wsUrl = this.#getWebSocketUrl(rpcUrl);

      this.#logger.info(`[WebSocketManager] Opening connection to ${wsUrl}`);

      const connectionId = await snap.request({
        method: 'snap_openWebSocket',
        params: {
          url: wsUrl,
          protocols: [],
        },
      });

      this.#networkConnections.set(network, connectionId);
      this.#isConnected = true;
      this.#reconnectAttempts = 0;

      this.#logger.info(
        `[WebSocketManager] Connected with ID: ${connectionId}`,
      );

      return connectionId;
    } catch (error) {
      this.#logger.error(
        '[WebSocketManager] Failed to open connection:',
        error,
      );
      throw error;
    }
  }

  /**
   * Closes the WebSocket connection for the specified network.
   * @param network - The network to close the connection for.
   */
  async closeConnection(network: Network): Promise<void> {
    const connectionId = this.#networkConnections.get(network);
    if (!connectionId) {
      return;
    }

    try {
      await snap.request({
        method: 'snap_closeWebSocket',
        params: { id: connectionId },
      });

      this.#networkConnections.delete(network);
      this.#isConnected = false;

      this.#logger.info(`[WebSocketManager] Closed connection ${connectionId}`);
    } catch (error) {
      this.#logger.error(
        '[WebSocketManager] Failed to close connection:',
        error,
      );
    }
  }

  //   /**
  //    * Subscribes to account changes for the specified account.
  //    * @param network - The network to subscribe on.
  //    * @param accountAddress - The account address to subscribe to.
  //    * @param callback - The callback function to call when account changes.
  //    * @param commitment - The commitment level for the subscription.
  //    * @returns A promise that resolves to the subscription ID.
  //    */
  //   async subscribeToAccount(
  //     network: Network,
  //     accountAddress: string,
  //     callback: (notification: any) => Promise<void>,
  //     commitment: 'processed' | 'confirmed' | 'finalized' = 'finalized',
  //   ): Promise<string> {
  //     const connectionId = await this.#ensureConnection(network);
  //     const subscriptionId = `account_${accountAddress}_${Date.now()}`;

  //     const subscription: WebSocketSubscription = {
  //       id: subscriptionId,
  //       method: 'accountSubscribe',
  //       params: [
  //         accountAddress,
  //         {
  //           encoding: 'jsonParsed',
  //           commitment,
  //         },
  //       ],
  //       callback,
  //     };

  //     await this.#sendSubscriptionRequest(connectionId, subscription);
  //     this.#subscriptions.set(subscriptionId, subscription);

  //     logger.info(`[WebSocketManager] Subscribed to account: ${accountAddress}`);
  //     return subscriptionId;
  //   }

  //   /**
  //    * Subscribes to signature notifications for transaction confirmation.
  //    * @param network - The network to subscribe on.
  //    * @param signature - The transaction signature to subscribe to.
  //    * @param callback - The callback function to call when signature updates.
  //    * @param commitment - The commitment level for the subscription.
  //    * @returns A promise that resolves to the subscription ID.
  //    */
  //   async subscribeToSignature(
  //     network: Network,
  //     signature: string,
  //     callback: (notification: any) => Promise<void>,
  //     commitment: 'processed' | 'confirmed' | 'finalized' = 'finalized',
  //   ): Promise<string> {
  //     const connectionId = await this.#ensureConnection(network);
  //     const subscriptionId = `signature_${signature}_${Date.now()}`;

  //     const subscription: WebSocketSubscription = {
  //       id: subscriptionId,
  //       method: 'signatureSubscribe',
  //       params: [signature, { commitment }],
  //       callback,
  //     };

  //     await this.#sendSubscriptionRequest(connectionId, subscription);
  //     this.#subscriptions.set(subscriptionId, subscription);

  //     logger.info(`[WebSocketManager] Subscribed to signature: ${signature}`);
  //     return subscriptionId;
  //   }

  async subscribe(
    connectionId: string,
    subscription: WebSocketSubscription,
  ): Promise<void> {
    const message: WebSocketMessage = {
      jsonrpc: '2.0',
      id: (this.#nextRequestId += 1),
      method: subscription.method,
      params: subscription.params,
    };

    await this.#sendMessage(connectionId, message);
  }

  /**
   * Unsubscribes from a specific subscription.
   * @param subscriptionId - The ID of the subscription to unsubscribe from.
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.#subscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    // Find the RPC subscription ID
    const rpcSubscriptionId = Array.from(this.#rpcSubscriptions.entries()).find(
      ([, id]) => id === subscriptionId,
    )?.[0];

    if (rpcSubscriptionId !== undefined) {
      const network = this.#getNetworkFromSubscription(subscription);
      const connectionId = this.#networkConnections.get(network);

      if (connectionId) {
        const unsubscribeMethod =
          subscription.method === 'accountSubscribe'
            ? 'accountUnsubscribe'
            : 'signatureUnsubscribe';

        await this.#sendMessage(connectionId, {
          jsonrpc: '2.0',
          id: (this.#nextRequestId += 1),
          method: unsubscribeMethod,
          params: [rpcSubscriptionId],
        });
      }

      this.#rpcSubscriptions.delete(rpcSubscriptionId);
    }

    this.#subscriptions.delete(subscriptionId);
    this.#logger.info(`[WebSocketManager] Unsubscribed: ${subscriptionId}`);
  }

  /**
   * Handles incoming WebSocket messages according to SIP-20 specification.
   * @param connectionId - The connection ID that received the message.
   * @param messageData - The WebSocket message data according to SIP-20 format.
   */
  async handleMessage(connectionId: string, messageData: any): Promise<void> {
    try {
      let parsedMessage: WebSocketMessage | WebSocketNotification;

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
            '[WebSocketManager] Unknown message data type:',
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
      } else if (parsedMessage.result !== undefined) {
        // Handle subscription confirmation
        this.#handleSubscriptionConfirmation(parsedMessage);
      } else if (parsedMessage.error) {
        this.#logger.error(
          '[WebSocketManager] Received error:',
          parsedMessage.error,
        );
      }
    } catch (error) {
      this.#logger.error('[WebSocketManager] Failed to handle message:', error);
    }
  }

  /**
   * Handles connection events (connect, disconnect, error).
   * @param connectionId - The connection ID for the event.
   * @param event - The type of connection event.
   * @param data - Optional event data.
   */
  async handleConnectionEvent(
    connectionId: string,
    event: 'connect' | 'disconnect' | 'error',
    data?: any,
  ): Promise<void> {
    this.#logger.info(
      `[WebSocketManager] Connection event: ${event} for ${connectionId}`,
    );

    if (event === 'disconnect' || event === 'error') {
      this.#isConnected = false;
      await this.#handleDisconnection(connectionId);
    } else if (event === 'connect') {
      this.#isConnected = true;
      this.#reconnectAttempts = 0;
      await this.#recoverSubscriptions(connectionId);
    }
  }

  /**
   * Registers a callback to be called when connection is recovered.
   * @param callback - The callback function to register.
   */
  onConnectionRecovery(callback: () => Promise<void>): void {
    this.#connectionRecoveryCallbacks.push(callback);
  }

  #ensureConnection = async (network: Network): Promise<string> => {
    let connectionId = this.#networkConnections.get(network);

    if (!connectionId || !this.#isConnected) {
      connectionId = await this.openConnection(network);
    }

    return connectionId;
  };

  #sendMessage = async (
    connectionId: string,
    message: WebSocketMessage,
  ): Promise<void> => {
    await snap.request({
      method: 'snap_sendWebSocketMessage' as any,
      params: {
        id: connectionId,
        message: JSON.stringify(message),
      },
    } as any);
  };

  #isNotification = (
    message: WebSocketMessage | WebSocketNotification,
  ): message is WebSocketNotification => {
    return (
      'method' in message && message.method !== undefined && 'params' in message
    );
  };

  #handleNotification = async (
    notification: WebSocketNotification,
  ): Promise<void> => {
    const { subscription: rpcSubscriptionId, result } = notification.params;
    const subscriptionId = this.#rpcSubscriptions.get(rpcSubscriptionId);

    if (!subscriptionId) {
      this.#logger.warn(
        `[WebSocketManager] No subscription found for RPC ID: ${rpcSubscriptionId}`,
      );
      return;
    }

    const subscription = this.#subscriptions.get(subscriptionId);
    if (!subscription) {
      this.#logger.warn(
        `[WebSocketManager] No subscription found for ID: ${subscriptionId}`,
      );
      return;
    }

    try {
      await subscription.callback(result);
    } catch (error) {
      this.#logger.error(
        `[WebSocketManager] Error in subscription callback for ${subscriptionId}:`,
        error,
      );
    }
  };

  #handleSubscriptionConfirmation = (message: WebSocketMessage): void => {
    if (typeof message.result === 'number' && message.id) {
      // Map RPC subscription ID to our internal subscription ID
      // This is a simplified approach - in practice, you'd need to track the request ID
      this.#logger.info(
        `[WebSocketManager] Subscription confirmed with RPC ID: ${message.result}`,
      );
    }
  };

  #handleDisconnection = async (connectionId: string): Promise<void> => {
    if (this.#reconnectAttempts < this.#maxReconnectAttempts) {
      this.#reconnectAttempts += 1;
      const delay =
        this.#reconnectDelay * Math.pow(2, this.#reconnectAttempts - 1);

      this.#logger.info(
        `[WebSocketManager] Attempting reconnection ${this.#reconnectAttempts}/${this.#maxReconnectAttempts} in ${delay}ms`,
      );

      setTimeout(() => {
        const reconnect = async (): Promise<void> => {
          try {
            // Find the network for this connection and reconnect
            const network = Array.from(this.#networkConnections.entries()).find(
              ([, id]) => id === connectionId,
            )?.[0];

            if (network) {
              await this.openConnection(network);
            }
          } catch (error) {
            this.#logger.error(
              '[WebSocketManager] Reconnection failed:',
              error,
            );
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        reconnect();
      }, delay);
    } else {
      this.#logger.error(
        '[WebSocketManager] Max reconnection attempts reached',
      );
    }
  };

  #recoverSubscriptions = async (connectionId: string): Promise<void> => {
    this.#logger.info(
      '[WebSocketManager] Recovering subscriptions after reconnection',
    );

    // Re-establish all subscriptions
    for (const subscription of this.#subscriptions.values()) {
      try {
        await this.subscribe(connectionId, subscription);
      } catch (error) {
        this.#logger.error(
          `[WebSocketManager] Failed to recover subscription ${subscription.id}:`,
          error,
        );
      }
    }

    // Call recovery callbacks
    for (const callback of this.#connectionRecoveryCallbacks) {
      try {
        await callback();
      } catch (error) {
        this.#logger.error(
          '[WebSocketManager] Error in connection recovery callback:',
          error,
        );
      }
    }
  };

  #getNetworkFromSubscription = (
    subscription: WebSocketSubscription,
  ): Network => {
    // This is a simplified approach - you might need a better way to determine the network
    // based on your specific implementation
    return Network.Mainnet; // Default to mainnet for now
  };

  #getWebSocketUrl = (httpUrl: string): string => {
    // Convert HTTP RPC URL to WebSocket URL
    return httpUrl.replace(/^https?:\/\//u, 'wss://').replace(/\/$/u, '');
  };
}
