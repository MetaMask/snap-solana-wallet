import { Network } from '../../core/constants/solana';
import type {
  ConnectionManagerPort,
  SubscriptionCallbacks,
  SubscriptionRequest,
} from '../../core/ports/subscriptions';
import { mockLogger } from '../../core/services/mocks/logger';
import { SubscriberAdapter } from './SubscriberAdapter';
import type { SubscriptionRepository } from './SubscriptionRepository';
import type { ConfirmedSubscription, PendingSubscription } from './types';

const createMockSubscriptionRequest = (
  method = 'some-method',
  unsubscribeMethod = 'some-unsubscribe-method',
  params = [],
  network = Network.Mainnet,
): SubscriptionRequest => ({
  method,
  unsubscribeMethod,
  params,
  network,
});

const createMockSubscriptionCallbacks = (
  onNotification = jest.fn(),
  onSubscriptionFailed = jest.fn(),
  onConnectionRecovery = jest.fn(),
): SubscriptionCallbacks => ({
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

describe('SubscriberAdapter', () => {
  let subscriptionManager: SubscriberAdapter;
  let mockConnectionManager: ConnectionManagerPort;
  let mockSubscriptionRepository: SubscriptionRepository;

  const mockNetwork = Network.Mainnet;
  const mockConnectionId = 'some-connection-id';
  const loggerScope = 'SubscriberAdapter';

  beforeEach(() => {
    jest.clearAllMocks();

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;

    mockConnectionManager = {
      getConnectionIdByNetwork: jest.fn().mockReturnValue(mockConnectionId),
      onConnectionRecovery: jest.fn(),
      handleConnectionEvent: jest.fn(),
    } as unknown as ConnectionManagerPort;

    mockSubscriptionRepository = {
      getAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByRequestId: jest.fn(),
      findByRpcSubscriptionId: jest.fn(),
    } as unknown as SubscriptionRepository;

    subscriptionManager = new SubscriberAdapter(
      mockConnectionManager,
      mockSubscriptionRepository,
      mockLogger,
    );
  });

  describe('subscribe', () => {
    describe('when the connection is already established', () => {
      it('sends a subscribe message when the connection is already established', async () => {
        jest.spyOn(snap, 'request').mockResolvedValueOnce(null);
        const request = createMockSubscriptionRequest();
        const callbacks = createMockSubscriptionCallbacks();

        await subscriptionManager.subscribe(request, callbacks);

        expect(snap.request).toHaveBeenCalledWith({
          method: 'snap_sendWebSocketMessage',
          params: {
            id: mockConnectionId,
            message: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'some-method',
              params: [],
            }),
          },
        });
      });

      it('registers a connection recovery callback when the subscription has one', async () => {
        const request = createMockSubscriptionRequest();
        const callbacks = createMockSubscriptionCallbacks();

        await subscriptionManager.subscribe(request, callbacks);

        expect(mockConnectionManager.onConnectionRecovery).toHaveBeenCalledWith(
          callbacks.onConnectionRecovery,
        );
      });
    });

    describe('when the connection is not (yet) established', () => {
      it('saves the subscription request and registers it to be sent later when the connection is established', async () => {
        jest
          .spyOn(mockConnectionManager, 'getConnectionIdByNetwork')
          .mockReturnValue(null);

        const connectionRecoveryCallbacks: (() => Promise<void>)[] = [];

        jest
          .spyOn(mockConnectionManager, 'onConnectionRecovery')
          .mockImplementation((callback) => {
            connectionRecoveryCallbacks.push(callback);
          });

        const request = createMockSubscriptionRequest();
        const callbacks = createMockSubscriptionCallbacks();

        await subscriptionManager.subscribe(request, callbacks);

        const pendingSubscription: PendingSubscription = {
          ...request,
          id: expect.any(String),
          status: 'pending',
          requestId: 0,
          createdAt: expect.any(String),
        };

        // Verify that the subscription request was saved, but not sent yet
        expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
          pendingSubscription,
        );
        expect(snap.request).not.toHaveBeenCalled();

        // Verify that the connection recovery callback was registered
        expect(mockConnectionManager.onConnectionRecovery).toHaveBeenCalledWith(
          expect.any(Function),
        );
        expect(connectionRecoveryCallbacks).toHaveLength(2); // 1 for the subscription's connection recovery callback, 1 for retrying the subscription request
        expect(connectionRecoveryCallbacks[0]).toBe(
          callbacks.onConnectionRecovery,
        );

        // Now, let's establish the connection
        jest
          .spyOn(mockConnectionManager, 'getConnectionIdByNetwork')
          .mockReturnValue(mockConnectionId);

        jest
          .spyOn(mockConnectionManager, 'handleConnectionEvent')
          .mockImplementation(async () => {
            await Promise.all(
              connectionRecoveryCallbacks.map(async (callback) => {
                await callback();
              }),
            );
          });

        // Send the connection event
        await mockConnectionManager.handleConnectionEvent(
          mockConnectionId,
          'connected',
        );

        // Verify that the subscription request was sent
        expect(snap.request).toHaveBeenCalledWith({
          method: 'snap_sendWebSocketMessage',
          params: {
            id: mockConnectionId,
            message: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'some-method',
              params: [],
            }),
          },
        });

        // Verify that the onConnectionRecovery callback was called
        expect(callbacks.onConnectionRecovery).toHaveBeenCalledWith();
      });

      it('registers a connection recovery callback when the subscription has one', async () => {
        const request = createMockSubscriptionRequest();
        const callbacks = createMockSubscriptionCallbacks();

        await subscriptionManager.subscribe(request, callbacks);

        expect(mockConnectionManager.onConnectionRecovery).toHaveBeenCalledWith(
          callbacks.onConnectionRecovery,
        );
      });
    });
  });

  describe('unsubscribe', () => {
    it('does nothing when the subscription does not exist', async () => {
      await subscriptionManager.unsubscribe('some-inexistent-id');

      // There was no subscription so there shouldn't be a call to unsubscribe.
      expect(snap.request).not.toHaveBeenCalled();
    });

    it('unsubscribes from an active subscription', async () => {
      const mockconfirmedSubscription: ConfirmedSubscription = {
        id: 'some-subscription-id',
        network: mockNetwork,
        unsubscribeMethod: 'some-unsubscribe-method',
        rpcSubscriptionId: 98765,
        status: 'confirmed',
        params: [],
        method: 'some-method',
        requestId: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        confirmedAt: '2024-01-02T00:00:00.000Z',
      };
      jest
        .spyOn(mockSubscriptionRepository, 'findById')
        .mockResolvedValue(mockconfirmedSubscription);

      const request = createMockSubscriptionRequest();
      const callbacks = createMockSubscriptionCallbacks();

      // Init the subscription
      const subscriptionId = await subscriptionManager.subscribe(
        request,
        callbacks,
      );

      // Confirm the subscription
      const confirmationMessage = createMockConfirmationMessage(2, 98765);
      await subscriptionManager.handleMessage(
        mockConnectionId,
        confirmationMessage,
      );

      // Unsubscribe
      await subscriptionManager.unsubscribe(subscriptionId);

      // First call to subscribe, second call to unsubscribe
      expect(snap.request).toHaveBeenCalledTimes(2);

      expect(snap.request).toHaveBeenNthCalledWith(2, {
        method: 'snap_sendWebSocketMessage',
        params: {
          id: mockConnectionId,
          message: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
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
          jest
            .spyOn(mockSubscriptionRepository, 'findByRpcSubscriptionId')
            .mockResolvedValue(undefined);
          const notification = createMockNotification(98765, {});

          await subscriptionManager.handleMessage(
            mockConnectionId,
            notification,
          );

          expect(mockLogger.warn).toHaveBeenCalledWith(
            `[${loggerScope}] Received a notification, but no matching active subscription found for RPC ID: 98765. It might be still pending confirmation.`,
          );
        });
      });

      describe('when there is a subscription for the message', () => {
        describe('when the subscription is pending', () => {
          beforeEach(async () => {
            const mockPendingSubscription: PendingSubscription = {
              id: 'some-subscription-id',
              method: 'some-method',
              unsubscribeMethod: 'some-unsubscribe-method',
              network: mockNetwork,
              status: 'pending',
              requestId: 1,
              createdAt: '2024-01-01T00:00:00.000Z',
              params: [],
            };

            jest
              .spyOn(mockSubscriptionRepository, 'findByRpcSubscriptionId')
              .mockResolvedValue(mockPendingSubscription);
          });

          it('does nothing', async () => {
            const notification = createMockNotification(98765, {});

            await subscriptionManager.handleMessage(
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
          let request: SubscriptionRequest;
          let callbacks: SubscriptionCallbacks;

          beforeEach(async () => {
            request = createMockSubscriptionRequest();
            callbacks = createMockSubscriptionCallbacks();
            const subscriptionId = await subscriptionManager.subscribe(
              request,
              callbacks,
            );

            const confirmationMessage = createMockConfirmationMessage(2, 98765);
            await subscriptionManager.handleMessage(
              mockConnectionId,
              confirmationMessage,
            );

            const confirmedSubscription: ConfirmedSubscription = {
              ...request,
              id: subscriptionId,
              rpcSubscriptionId: 98765,
              status: 'confirmed',
              requestId: 2,
              createdAt: '2024-01-01T00:00:00.000Z',
              confirmedAt: '2024-01-02T00:00:00.000Z',
            };

            jest
              .spyOn(mockSubscriptionRepository, 'findByRpcSubscriptionId')
              .mockResolvedValue(confirmedSubscription);
          });

          it('handles a notification', async () => {
            const notification = createMockNotification(98765, {
              context: { Slot: 348893275 },
              value: { lamports: 116044436802 },
            });

            await subscriptionManager.handleMessage(
              mockConnectionId,
              notification,
            );

            expect(callbacks.onNotification).toHaveBeenCalledWith({
              context: { Slot: 348893275 },
              value: { lamports: 116044436802 },
            });
          });

          it('catches errors on the subscription callback', async () => {
            jest
              .spyOn(callbacks, 'onNotification')
              .mockImplementation()
              .mockRejectedValue(new Error('Subscription callback error'));

            const notification = createMockNotification(98765, {
              context: { Slot: 348893275 },
              value: { lamports: 116044436802 },
            });

            await subscriptionManager.handleMessage(
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
          await subscriptionManager.handleMessage(mockConnectionId, message);

          expect(mockLogger.warn).toHaveBeenCalledWith(
            `[${loggerScope}] Received subscription confirmation, but no matching pending subscription found for request ID: 2.`,
          );
        });
      });

      describe('when there is a pending subscription for the message', () => {
        let request: SubscriptionRequest;
        let callbacks: SubscriptionCallbacks;
        let subscriptionId: string;
        let pendingSubscription: PendingSubscription;

        beforeEach(async () => {
          request = createMockSubscriptionRequest();
          callbacks = createMockSubscriptionCallbacks();

          subscriptionId = await subscriptionManager.subscribe(
            request,
            callbacks,
          );

          pendingSubscription = {
            ...request,
            id: subscriptionId,
            status: 'pending',
            requestId: 2,
            createdAt: '2024-01-01T00:00:00.000Z',
          };

          jest
            .spyOn(mockSubscriptionRepository, 'findByRequestId')
            .mockResolvedValue(pendingSubscription);
        });

        it('confirms the subscription', async () => {
          const confirmationMessage = createMockConfirmationMessage(2, 98765);

          await subscriptionManager.handleMessage(
            mockConnectionId,
            confirmationMessage,
          );

          // Verify the confirmation was updated to 'confirmed'
          const confirmedSubscription: ConfirmedSubscription = {
            ...pendingSubscription,
            status: 'confirmed',
            rpcSubscriptionId: 98765,
            confirmedAt: expect.any(String),
          };

          expect(mockSubscriptionRepository.update).toHaveBeenCalledWith(
            confirmedSubscription,
          );

          jest
            .spyOn(mockSubscriptionRepository, 'findByRpcSubscriptionId')
            .mockResolvedValue(confirmedSubscription);

          // Verify that notifications are now handled
          const notification = createMockNotification(98765, {
            context: { Slot: 348893275 },
            value: { lamports: 116044436802 },
          });

          await subscriptionManager.handleMessage(
            mockConnectionId,
            notification,
          );

          expect(callbacks.onNotification).toHaveBeenCalledWith({
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
          let request: SubscriptionRequest;
          let callbacks: SubscriptionCallbacks;
          let subscriptionId: string;

          beforeEach(async () => {
            request = createMockSubscriptionRequest(); // request ID is 2 (request ID 1 was for opening the connection), hence why we createMockFailure with 2 as first argument
            callbacks = createMockSubscriptionCallbacks();

            subscriptionId = await subscriptionManager.subscribe(
              request,
              callbacks,
            );

            const pendingSubscription: PendingSubscription = {
              ...request,
              id: subscriptionId,
              status: 'pending',
              requestId: 2,
              createdAt: '2024-01-01T00:00:00.000Z',
            };

            jest
              .spyOn(mockSubscriptionRepository, 'findByRequestId')
              .mockResolvedValue(pendingSubscription);
          });

          it('logs the error', async () => {
            await subscriptionManager.handleMessage(mockConnectionId, message);

            expect(mockLogger.error).toHaveBeenCalledWith(
              `[${loggerScope}] Subscription establishment failed for ${subscriptionId}:`,
              {
                code: -32000,
                message: 'Subscription error',
              },
            );
          });

          it('calls the subscription callback with the error', async () => {
            await subscriptionManager.handleMessage(mockConnectionId, message);

            expect(callbacks.onSubscriptionFailed).toHaveBeenCalledWith({
              code: -32000,
              message: 'Subscription error',
            });
          });
        });

        describe('when there is no subscription for the message', () => {
          it('logs an error and does nothing', async () => {
            await subscriptionManager.handleMessage(mockConnectionId, message);

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
          await subscriptionManager.handleMessage(mockConnectionId, message);

          expect(mockLogger.error).toHaveBeenCalledWith(
            `[${loggerScope}] Connection-level error:`,
            'Some connection error',
          );
        });
      });
    });
  });

  describe('complex flows', () => {});
  // User subscribes before the connection is established. Check that the subscription is sent when the connection is established and we recover gaps.
  // Connection established. User subscribes. Connection is lost before the subscription is confirmed. Check that the subscription is sent when the connection is reestablished and we recover gaps.
  // Connection established. User subscribes. Subscription is confirmed. Connection is lost. Check that the subscription is sent when the connection is reestablished and we recover gaps.
});
