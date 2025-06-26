import type { SubscriptionConnectionManagerPort } from '../../core/ports';
import { mockLogger } from '../../core/services/mocks/logger';
import type { Subscription } from '../../entities';
import { SubscriptionTransportAdapter } from './SubscriptionTransportAdapter';

const createMockSubscription = (
  id = 'some-subscription-id',
  method = 'some-method',
  unsubscribeMethod = 'some-unsubscribe-method',
  params = [],
  onNotification = jest.fn(),
  onSubscriptionFailed = jest.fn(),
  onConnectionRecovery = jest.fn(),
): Subscription => ({
  id,
  method,
  unsubscribeMethod,
  params,
  onNotification,
  onSubscriptionFailed,
  onConnectionRecovery,
});

const createMockConfirmationMessage = (id: number, result: number) => ({
  type: 'text',
  message: JSON.stringify({
    jsonrpc: '2.0',
    id,
    result,
  }),
});

const createMockNotification = (subscription: number, result: any) => ({
  type: 'text',
  message: JSON.stringify({
    jsonrpc: '2.0',
    method: 'some-method',
    params: { subscription, result },
  }),
});

const createMockFailure = (id: number | undefined, error: any) => ({
  type: 'text',
  message: JSON.stringify({
    jsonrpc: '2.0',
    id,
    error,
  }),
});

describe('SubscriptionTransportAdapter', () => {
  let subscriptionTransport: SubscriptionTransportAdapter;
  let mockSubscriptionConnectionManager: SubscriptionConnectionManagerPort;
  const mockConnectionId = 'some-connection-id';
  const loggerScope = 'SubscriptionTransportAdapter';

  beforeEach(() => {
    jest.clearAllMocks();

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;

    mockSubscriptionConnectionManager = {
      getConnectionIdByNetwork: jest.fn().mockReturnValue(mockConnectionId),
      onConnectionRecovery: jest.fn(),
    } as unknown as SubscriptionConnectionManagerPort;

    subscriptionTransport = new SubscriptionTransportAdapter(
      mockSubscriptionConnectionManager,
      mockLogger,
    );
  });

  describe('subscribe', () => {
    it('sends a subscribe message', async () => {
      jest.spyOn(snap, 'request').mockResolvedValueOnce(null);
      const subscription = createMockSubscription();

      await subscriptionTransport.subscribe('some-connection-id', subscription);

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_sendWebSocketMessage',
        params: {
          id: 'some-connection-id',
          message: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'some-method',
            params: [],
          }),
        },
      });
    });

    it('registers a connection recovery callback when the subscription has one', async () => {
      const subscription = createMockSubscription();

      await subscriptionTransport.subscribe(mockConnectionId, subscription);

      expect(
        mockSubscriptionConnectionManager.onConnectionRecovery,
      ).toHaveBeenCalledWith(subscription.onConnectionRecovery);
    });
  });

  describe('unsubscribe', () => {
    it('does nothing when the subscription does not exist', async () => {
      await subscriptionTransport.unsubscribe('some-inexistent-id');

      // There was no subscription so there shouldn't be a call to unsubscribe.
      expect(snap.request).not.toHaveBeenCalled();
    });

    it('unsubscribes from an active subscription', async () => {
      const subscription = createMockSubscription();

      // Init the subscription
      await subscriptionTransport.subscribe(mockConnectionId, subscription);

      // Confirm the subscription
      const confirmationMessage = createMockConfirmationMessage(2, 98765);
      await subscriptionTransport.handleMessage(
        mockConnectionId,
        confirmationMessage,
      );

      // Unsubscribe
      await subscriptionTransport.unsubscribe(subscription.id);

      // First call to subscribe, second call to unsubscribe
      expect(snap.request).toHaveBeenCalledTimes(2);

      expect(snap.request).toHaveBeenNthCalledWith(2, {
        method: 'snap_sendWebSocketMessage',
        params: {
          id: mockConnectionId,
          message: JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'some-unsubscribe-method',
            params: [98765],
          }),
        },
      });
    });
  });

  describe('handleMessage', () => {
    describe('when the message is a notification', () => {
      describe('when there is no subscription for the message', () => {
        it('logs a warning and does nothing', async () => {
          const notification = createMockNotification(98765, {});

          await subscriptionTransport.handleMessage(
            mockConnectionId,
            notification,
          );

          expect(mockLogger.warn).toHaveBeenCalledWith(
            `[${loggerScope}] Received a notification, but no matching active subscription found for RPC ID: 98765`,
          );
        });
      });

      describe('when there is a subscription for the message', () => {
        let subscription: Subscription;

        beforeEach(async () => {
          subscription = createMockSubscription();
          await subscriptionTransport.subscribe(mockConnectionId, subscription);
        });

        describe('when the subscription is pending', () => {
          it('does nothing', async () => {
            const notification = createMockNotification(98765, {});

            await subscriptionTransport.handleMessage(
              mockConnectionId,
              notification,
            );

            expect(mockLogger.warn).not.toHaveBeenNthCalledWith(
              1,
              `[${loggerScope}] Received a notification, but no matching active subscription found for RPC ID:`,
              98765,
            );

            expect(mockLogger.warn).not.toHaveBeenNthCalledWith(
              2,
              `[${loggerScope}] Subscription is still pending for RPC ID:`,
              98765,
            );
          });
        });

        describe('when the subscription is confirmed', () => {
          beforeEach(async () => {
            const confirmationMessage = createMockConfirmationMessage(2, 98765);
            await subscriptionTransport.handleMessage(
              mockConnectionId,
              confirmationMessage,
            );
          });

          it('handles a notification', async () => {
            const notification = createMockNotification(98765, {
              context: { Slot: 348893275 },
              value: { lamports: 116044436802 },
            });

            await subscriptionTransport.handleMessage(
              mockConnectionId,
              notification,
            );

            expect(subscription.onNotification).toHaveBeenCalledWith({
              context: { Slot: 348893275 },
              value: { lamports: 116044436802 },
            });
          });

          it('catches errors on the subscription callback', async () => {
            jest
              .spyOn(subscription, 'onNotification')
              .mockImplementation()
              .mockRejectedValue(new Error('Subscription callback error'));

            const notification = createMockNotification(98765, {
              context: { Slot: 348893275 },
              value: { lamports: 116044436802 },
            });

            await subscriptionTransport.handleMessage(
              mockConnectionId,
              notification,
            );

            expect(mockLogger.error).toHaveBeenCalledWith(
              `[${loggerScope}] Error in subscription callback for 98765:`,
              new Error('Subscription callback error'),
            );
          });
        });
      });
    });

    describe('when the message is a subscription confirmation', () => {
      describe('when there is no subscription for the message', () => {
        it('logs a warning and does nothing', async () => {
          const message = createMockConfirmationMessage(2, 98765);
          await subscriptionTransport.handleMessage(mockConnectionId, message);

          expect(mockLogger.warn).toHaveBeenCalledWith(
            `[${loggerScope}] Received confirmation for unknown request ID: 2`,
          );
        });
      });

      describe('when there is a subscription for the message', () => {
        let subscription: Subscription;

        beforeEach(async () => {
          subscription = createMockSubscription();
          await subscriptionTransport.subscribe(mockConnectionId, subscription);
        });

        it('makes the subscription active', async () => {
          const confirmationMessage = createMockConfirmationMessage(2, 98765);

          await subscriptionTransport.handleMessage(
            mockConnectionId,
            confirmationMessage,
          );

          // Verify the confirmation was logged
          expect(mockLogger.info).toHaveBeenCalledWith(
            `[${loggerScope}] Subscription confirmed: request ID: 2 -> RPC ID: 98765`,
          );

          // Verify that notifications are now handled
          const notification = createMockNotification(98765, {
            context: { Slot: 348893275 },
            value: { lamports: 116044436802 },
          });

          await subscriptionTransport.handleMessage(
            mockConnectionId,
            notification,
          );

          expect(subscription.onNotification).toHaveBeenCalledWith({
            context: { Slot: 348893275 },
            value: { lamports: 116044436802 },
          });
        });
      });
    });

    describe('when the message is a failure', () => {
      describe('when it is a response to a specific request', () => {
        const message = createMockFailure(2, {
          code: -32000,
          message: 'Subscription error',
        });

        describe('when there is a subscription for the message', () => {
          let subscription: Subscription;

          beforeEach(async () => {
            subscription = createMockSubscription(); // request ID is 2 (request ID 1 was for opening the connection), hence why we createMockFailure with 2 as first argument
            await subscriptionTransport.subscribe(
              mockConnectionId,
              subscription,
            );
          });

          it('logs the error', async () => {
            await subscriptionTransport.handleMessage(
              mockConnectionId,
              message,
            );

            expect(mockLogger.error).toHaveBeenCalledWith(
              `[${loggerScope}] Subscription establishment failed for some-subscription-id:`,
              {
                code: -32000,
                message: 'Subscription error',
              },
            );
          });

          it('calls the subscription callback with the error', async () => {
            await subscriptionTransport.handleMessage(
              mockConnectionId,
              message,
            );

            expect(subscription.onSubscriptionFailed).toHaveBeenCalledWith({
              code: -32000,
              message: 'Subscription error',
            });
          });
        });

        describe('when there is no subscription for the message', () => {
          it('logs an error and does nothing', async () => {
            await subscriptionTransport.handleMessage(
              mockConnectionId,
              message,
            );

            expect(mockLogger.error).toHaveBeenCalledWith(
              `[${loggerScope}] Received error for request ID: 2`,
              {
                code: -32000,
                message: 'Subscription error',
              },
            );
          });
        });
      });

      describe('when it is a connection-level error', () => {
        const message = {
          error: 'Some connection error',
        };

        it('logs an error and does nothing', async () => {
          await subscriptionTransport.handleMessage(mockConnectionId, message);

          expect(mockLogger.error).toHaveBeenCalledWith(
            `[${loggerScope}] Connection-level error:`,
            'Some connection error',
          );
        });
      });
    });
  });

  //   describe('complex flows', () => {});
  // User subscribes before the connection is established. Check that the subscription is sent when the connection is established and we recover gaps.
  // Connection established. User subscribes. Connection is lost before the subscription is confirmed. Check that the subscription is sent when the connection is reestablished and we recover gaps.
  // Connection established. User subscribes. Subscription is confirmed. Connection is lost. Check that the subscription is sent when the connection is reestablished and we recover gaps.
});
