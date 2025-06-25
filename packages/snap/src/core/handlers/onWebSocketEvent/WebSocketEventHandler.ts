import type { WebSocketEvent } from '@metamask/snaps-sdk';

import type {
  SubscriptionConnectionManagerPort,
  SubscriptionTransportPort,
} from '../../ports';
import type { ILogger } from '../../utils/logger';

export class WebSocketEventHandler {
  readonly #connectionManager: SubscriptionConnectionManagerPort;

  readonly #subscriptionTransport: SubscriptionTransportPort;

  readonly #logger: ILogger;

  constructor(
    connectionManager: SubscriptionConnectionManagerPort,
    subscriptionTransport: SubscriptionTransportPort,
    logger: ILogger,
  ) {
    this.#connectionManager = connectionManager;
    this.#subscriptionTransport = subscriptionTransport;
    this.#logger = logger;
  }

  /**
   * Handles incoming WebSocket events according to [SIP-20](https://github.com/MetaMask/SIPs/blob/main/SIPS/sip-20.md) specification.
   * Routes events to the appropriate transport layer methods.
   *
   * @param event - The WebSocket event to handle.
   * @returns A promise that resolves when the event is handled.
   */
  async handle(event: WebSocketEvent): Promise<void> {
    try {
      this.#logger.log('[🌐 onWebSocketEvent]', event);

      switch (event.type) {
        case 'message':
          await this.#subscriptionTransport.handleMessage(event.id, event.data);
          break;
        case 'open':
          await this.#connectionManager.handleConnectionEvent(
            event.id,
            'connect',
            event,
          );
          break;
        case 'close':
          await this.#connectionManager.handleConnectionEvent(
            event.id,
            'disconnect',
            event,
          );
          break;
        default:
          this.#logger.warn(
            `[onWebSocketEvent] Received event with unknown type: ${event}`,
          );
      }
    } catch (error: any) {
      this.#logger.error(
        '[onWebSocketEvent] Error handling WebSocket event:',
        error,
      );
    }
  }
}
