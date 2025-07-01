import type { WebSocketMessage } from '@metamask/snaps-sdk';

import type {
  ConfirmedSubscription,
  PendingSubscription,
  SubscriptionCallbacks,
  SubscriptionRequest,
} from '../../../entities';
import { EventEmitter } from '../../../infrastructure';
import { Network } from '../../constants/solana';
import { mockLogger } from '../mocks/logger';
import type { SubscriptionRepository } from './SubscriptionRepository';
import { SubscriptionService } from './SubscriptionService';
import type { WebSocketConnectionService } from './WebSocketConnectionService';

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

const createMockConfirmationMessage = (
  id: string = globalThis.crypto.randomUUID(),
  rpcSubscriptionId = 98765,
): WebSocketMessage => ({
  type: 'message',
  id,
  origin: 'some-origin',
  data: {
    type: 'text',
    message: JSON.stringify({
      jsonrpc: '2.0',
      id,
      result: rpcSubscriptionId,
    }),
  },
});

const createMockNotification = (
  id: string = globalThis.crypto.randomUUID(),
  rpcSubscriptionId = 98765,
  result: any = {},
) => ({
  type: 'message',
  id,
  origin: 'some-origin',
  data: {
    type: 'text',
    message: JSON.stringify({
      jsonrpc: '2.0',
      method: 'some-method',
      params: { subscription: rpcSubscriptionId, result },
    }),
  },
});

const createMockFailure = (
  error: any,
  id: string = globalThis.crypto.randomUUID(),
) => ({
  type: 'message',
  id,
  data: {
    type: 'text',
    message: JSON.stringify({
      jsonrpc: '2.0',
      id,
      error,
    }),
  },
});

const simulateDisconnection = async (
  eventEmitter: EventEmitter,
  connectionId: string,
) => {
  await eventEmitter.emitSync('onWebSocketEvent', {
    event: {
      type: 'close',
      id: connectionId,
    },
  });
};

const simulateReconnection = async (
  eventEmitter: EventEmitter,
  connectionId: string,
) => {
  await eventEmitter.emitSync('onWebSocketEvent', {
    event: {
      type: 'open',
      id: connectionId,
    },
  });
};

const triggerConnectionRecoveryCallbacks = async (
  connectionRecoveryCallbacks: Map<Network, (() => Promise<void>)[]>,
  network: Network,
) => {
  const recoveryCallbacks = connectionRecoveryCallbacks.get(network) ?? [];
  await Promise.all(
    recoveryCallbacks.map(async (callback) => {
      await callback();
    }),
  );
};

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let mockWebSocketConnectionService: WebSocketConnectionService;
  let mockSubscriptionRepository: SubscriptionRepository;
  let mockEventEmitter: EventEmitter;
  let loggerScope: string;

  const mockNetwork = Network.Mainnet;
  const mockConnectionId = 'some-connection-id';

  beforeEach(() => {
    jest.clearAllMocks();

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;

    mockWebSocketConnectionService = {
      getConnectionIdByNetwork: jest.fn().mockReturnValue(mockConnectionId),
      onConnectionRecovery: jest.fn(),
      handleConnectionEvent: jest.fn(),
    } as unknown as WebSocketConnectionService;

    mockSubscriptionRepository = {
      getAll: jest.fn(),
      getById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findBy: jest.fn(),
    } as unknown as SubscriptionRepository;

    mockEventEmitter = new EventEmitter(mockLogger);

    service = new SubscriptionService(
      mockWebSocketConnectionService,
      mockSubscriptionRepository,
      mockEventEmitter,
      mockLogger,
    );

    loggerScope = service.loggerPrefix;
  });

  describe('subscribe', () => {
    it('persists the subscription in state', async () => {
      const request = createMockSubscriptionRequest();
      const callbacks = createMockSubscriptionCallbacks();

      await service.subscribe(request, callbacks);

      expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
        }),
      );
    });

    it('registers the subscription callbacks', async () => {
      const request = createMockSubscriptionRequest();
      const callbacks = createMockSubscriptionCallbacks();

      await service.subscribe(request, callbacks);

      expect(
        mockWebSocketConnectionService.onConnectionRecovery,
      ).toHaveBeenCalledWith(request.network, callbacks.onConnectionRecovery);
    });

    describe('when the connection is open', () => {
      it('sends a subscribe message', async () => {
        jest.spyOn(snap, 'request').mockResolvedValueOnce(null);
        const request = createMockSubscriptionRequest();
        const callbacks = createMockSubscriptionCallbacks();

        const subscriptionId = await service.subscribe(request, callbacks);

        expect(snap.request).toHaveBeenCalledWith({
          method: 'snap_sendWebSocketMessage',
          params: {
            id: mockConnectionId,
            message: JSON.stringify({
              jsonrpc: '2.0',
              id: subscriptionId,
              method: 'some-method',
              params: [],
            }),
          },
        });
      });
    });

    // See 'complex flows' below for when the connection is not (yet) open.
  });

  describe('unsubscribe', () => {
    it('does nothing when the subscription does not exist', async () => {
      await service.unsubscribe('some-inexistent-id');

      // There was no subscription so there shouldn't be a call to unsubscribe.
      expect(snap.request).not.toHaveBeenCalled();
    });

    it('unsubscribes from an active subscription', async () => {
      const mockSubscriptionId = 'some-subscription-id';
      const mockConfirmedSubscription: ConfirmedSubscription = {
        ...createMockSubscriptionRequest(),
        id: mockSubscriptionId,
        status: 'confirmed',
        requestId: mockSubscriptionId,
        rpcSubscriptionId: 98765,
        createdAt: '2024-01-01T00:00:00.000Z',
        confirmedAt: '2024-01-02T00:00:00.000Z',
      };
      jest
        .spyOn(mockSubscriptionRepository, 'getById')
        .mockResolvedValue(mockConfirmedSubscription);

      // Unsubscribe
      await service.unsubscribe('some-subscription-id');

      // Verify unsubscribe was called
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_sendWebSocketMessage',
        params: {
          id: mockConnectionId,
          message: expect.stringContaining(
            '"method":"some-unsubscribe-method"',
          ),
        },
      });
    });
  });

  describe('#handleWebSocketEvent', () => {
    describe('when the message is a notification', () => {
      describe('when there is no confirmed subscription for the message', () => {
        it('logs a warning and does nothing', async () => {
          jest
            .spyOn(mockSubscriptionRepository, 'getById')
            .mockResolvedValue(undefined);
          const notification = createMockNotification();

          await mockEventEmitter.emitSync('onWebSocketEvent', notification);

          expect(mockLogger.warn).toHaveBeenCalledWith(
            loggerScope,
            'Received a notification, but no matching confirmed subscription found for RPC subscription ID: 98765.',
          );
        });
      });

      describe('when there is a confirmed subscription for the message', () => {
        let request: SubscriptionRequest;
        let callbacks: SubscriptionCallbacks;

        beforeEach(async () => {
          request = createMockSubscriptionRequest();
          callbacks = createMockSubscriptionCallbacks();

          const subscriptionId = await service.subscribe(request, callbacks);

          const confirmationMessage = createMockConfirmationMessage(
            subscriptionId,
            98765,
          );

          await mockEventEmitter.emitSync('onWebSocketEvent', {
            event: confirmationMessage,
          });

          const confirmedSubscription: ConfirmedSubscription = {
            ...request,
            id: subscriptionId,
            rpcSubscriptionId: 98765,
            status: 'confirmed',
            requestId: subscriptionId,
            createdAt: '2024-01-01T00:00:00.000Z',
            confirmedAt: '2024-01-02T00:00:00.000Z',
          };

          jest
            .spyOn(mockSubscriptionRepository, 'findBy')
            .mockResolvedValue(confirmedSubscription);
        });

        it('handles a notification', async () => {
          const notification = createMockNotification(undefined, undefined, {
            context: { Slot: 348893275 },
            value: { lamports: 116044436802 },
          });

          await mockEventEmitter.emitSync('onWebSocketEvent', notification);

          expect(callbacks.onNotification).toHaveBeenCalledWith({
            context: { Slot: 348893275 },
            value: { lamports: 116044436802 },
          });
        });

        it('catches errors on the subscription callback', async () => {
          const error = new Error('Subscription callback error');
          jest
            .spyOn(callbacks, 'onNotification')
            .mockImplementation()
            .mockRejectedValue(error);
          const notification = createMockNotification(undefined, undefined, {
            context: { Slot: 348893275 },
            value: { lamports: 116044436802 },
          });

          await mockEventEmitter.emitSync('onWebSocketEvent', notification);

          expect(mockLogger.error).toHaveBeenCalledWith(
            loggerScope,
            'Error in subscription callback for 98765:',
            error,
          );
        });
      });
    });

    describe('when the message is a subscription confirmation', () => {
      describe('when there is no subscription for the message', () => {
        it('logs a warning and does nothing', async () => {
          const message = createMockConfirmationMessage('some-subscription-id');

          await mockEventEmitter.emitSync('onWebSocketEvent', message);

          expect(mockLogger.warn).toHaveBeenCalledWith(
            loggerScope,
            'Received subscription confirmation, but no matching pending subscription found for subscription ID: some-subscription-id.',
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
          subscriptionId = await service.subscribe(request, callbacks);

          pendingSubscription = {
            ...request,
            id: subscriptionId,
            status: 'pending',
            requestId: subscriptionId,
            createdAt: '2024-01-01T00:00:00.000Z',
          };

          jest
            .spyOn(mockSubscriptionRepository, 'getById')
            .mockResolvedValue(pendingSubscription);
        });

        it('confirms the subscription', async () => {
          const confirmationMessage = createMockConfirmationMessage();

          await mockEventEmitter.emitSync(
            'onWebSocketEvent',
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

          // Verify that notifications are now handled

          jest
            .spyOn(mockSubscriptionRepository, 'findBy')
            .mockResolvedValue(confirmedSubscription);

          const notification = createMockNotification(
            confirmedSubscription.id,
            98765,
            {
              context: { Slot: 348893275 },
              value: { lamports: 116044436802 },
            },
          );

          await mockEventEmitter.emitSync('onWebSocketEvent', notification);

          expect(callbacks.onNotification).toHaveBeenCalledWith({
            context: { Slot: 348893275 },
            value: { lamports: 116044436802 },
          });
        });
      });
    });

    describe('when the message is a failure', () => {
      describe('when it is a response to a specific request', () => {
        const message = createMockFailure({
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
            subscriptionId = await service.subscribe(request, callbacks);

            const pendingSubscription: PendingSubscription = {
              ...request,
              id: subscriptionId,
              status: 'pending',
              requestId: subscriptionId,
              createdAt: '2024-01-01T00:00:00.000Z',
            };

            jest
              .spyOn(mockSubscriptionRepository, 'getById')
              .mockResolvedValue(pendingSubscription);
          });

          it('logs the error', async () => {
            await mockEventEmitter.emitSync('onWebSocketEvent', message);

            expect(mockLogger.error).toHaveBeenCalledWith(
              loggerScope,
              `Subscription establishment failed for ${subscriptionId}:`,
              {
                code: -32000,
                message: 'Subscription error',
              },
            );
          });

          it('calls the subscription callback with the error', async () => {
            await mockEventEmitter.emitSync('onWebSocketEvent', message);

            expect(callbacks.onSubscriptionFailed).toHaveBeenCalledWith({
              code: -32000,
              message: 'Subscription error',
            });
          });
        });

        describe('when there is no subscription for the message', () => {
          it('logs an error and does nothing', async () => {
            await mockEventEmitter.emitSync('onWebSocketEvent', message);

            expect(mockLogger.error).toHaveBeenCalledWith(
              loggerScope,
              `Received error for request ID: ${message.id}`,
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
          type: 'message',
          id: 'some-id',
          origin: 'some-origin',
          data: {
            type: 'text',
            message: JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32700,
                message: 'Parse error',
              },
            }),
          },
        };

        it('logs an error and does nothing', async () => {
          await mockEventEmitter.emitSync('onWebSocketEvent', message);

          expect(mockLogger.error).toHaveBeenCalledWith(
            loggerScope,
            'Connection-level error:',
            {
              code: -32700,
              message: 'Parse error',
            },
          );
        });
      });
    });
  });

  describe('re-subscription scenarios', () => {
    let connectionRecoveryCallbacks: Map<Network, (() => Promise<void>)[]>;

    beforeEach(() => {
      jest.clearAllMocks();

      // Prepare the mock connection manager to handle the reconnection
      connectionRecoveryCallbacks = new Map();

      jest
        .spyOn(mockWebSocketConnectionService, 'onConnectionRecovery')
        .mockImplementation((network, callback) => {
          connectionRecoveryCallbacks.set(network, [
            ...(connectionRecoveryCallbacks.get(network) ?? []),
            callback,
          ]);
        });
    });

    describe('when a subscription request is sent, but no open connection', () => {
      it('saves the subscription request, and sends it once the connection is opened', async () => {
        // Mock the getConnectionIdByNetwork to simulate connection state changes
        jest
          .spyOn(mockWebSocketConnectionService, 'getConnectionIdByNetwork')
          .mockResolvedValue(null)
          .mockResolvedValueOnce(null) // First call returns null (no connection)
          .mockResolvedValueOnce(mockConnectionId); // Second call returns connection ID

        const request = createMockSubscriptionRequest();
        const callbacks = createMockSubscriptionCallbacks();
        const subscriptionId = await service.subscribe(request, callbacks);

        const pendingSubscription: PendingSubscription = {
          ...request,
          id: subscriptionId,
          status: 'pending',
          requestId: subscriptionId,
          createdAt: expect.any(String),
        };

        // Verify that the subscription request was saved, but not sent yet
        expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
          pendingSubscription,
        );
        expect(snap.request).not.toHaveBeenCalled();

        // Verify that the connection recovery callback was registered
        expect(
          mockWebSocketConnectionService.onConnectionRecovery,
        ).toHaveBeenCalledWith(mockNetwork, expect.any(Function));
        expect(connectionRecoveryCallbacks.get(mockNetwork)).toHaveLength(2); // 1 for the subscription's connection recovery callback, 1 for retrying the subscription request
        expect(connectionRecoveryCallbacks.get(mockNetwork)?.[0]).toBe(
          callbacks.onConnectionRecovery,
        );

        // Now, let's establish the connection
        jest
          .spyOn(mockWebSocketConnectionService, 'getConnectionIdByNetwork')
          .mockResolvedValue(mockConnectionId);

        // Send the connection event
        await simulateReconnection(mockEventEmitter, mockConnectionId);

        // Manually trigger the connection recovery callbacks since we can't mock the private method #handleWebSocketEvent
        await triggerConnectionRecoveryCallbacks(
          connectionRecoveryCallbacks,
          mockNetwork,
        );

        // Verify that the subscription request was sent
        expect(snap.request).toHaveBeenCalledWith({
          method: 'snap_sendWebSocketMessage',
          params: {
            id: mockConnectionId,
            message: JSON.stringify({
              jsonrpc: '2.0',
              id: subscriptionId,
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

        await service.subscribe(request, callbacks);

        expect(
          mockWebSocketConnectionService.onConnectionRecovery,
        ).toHaveBeenCalledWith(mockNetwork, callbacks.onConnectionRecovery);
      });
    });

    describe('when the connection is lost BEFORE the subscription is confirmed', () => {
      it('re-sends the subscription request when the connection is reestablished', async () => {
        const request = createMockSubscriptionRequest();
        const callbacks = createMockSubscriptionCallbacks();
        const subscriptionId = await service.subscribe(request, callbacks);

        const pendingSubscription: PendingSubscription = {
          ...request,
          id: subscriptionId,
          status: 'pending',
          requestId: subscriptionId,
          createdAt: expect.any(String),
        };

        // Verify that the subscription request was saved
        expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
          pendingSubscription,
        );

        // Verify that the connection request was sent
        expect(snap.request).toHaveBeenCalledWith({
          method: 'snap_sendWebSocketMessage',
          params: {
            id: mockConnectionId,
            message: JSON.stringify({
              jsonrpc: '2.0',
              id: subscriptionId,
              method: 'some-method',
              params: [],
            }),
          },
        });

        // Do not confirm the subscription yet

        // Now, simulate a disconnection (this has no direct effect, it's just for clarity of the test)
        await simulateDisconnection(mockEventEmitter, mockConnectionId);

        // Simulate a reconnection
        await simulateReconnection(mockEventEmitter, mockConnectionId);

        // Manually trigger the connection recovery callbacks since we can't mock the private method #handleWebSocketEvent
        await triggerConnectionRecoveryCallbacks(
          connectionRecoveryCallbacks,
          mockNetwork,
        );

        // Verify that the subscription request was sent again
        expect(snap.request).toHaveBeenCalledWith({
          method: 'snap_sendWebSocketMessage',
          params: {
            id: mockConnectionId,
            message: JSON.stringify({
              jsonrpc: '2.0',
              id: subscriptionId,
              method: 'some-method',
              params: [],
            }),
          },
        });

        // Verify that the onConnectionRecovery callback was called
        expect(callbacks.onConnectionRecovery).toHaveBeenCalledWith();
      });
    });

    describe('when the connection is lost AFTER the subscription is confirmed', () => {
      it('re-sends the subscription request when the connection is reestablished', async () => {
        const request = createMockSubscriptionRequest();
        const callbacks = createMockSubscriptionCallbacks();
        const subscriptionId = await service.subscribe(request, callbacks);

        const pendingSubscription: PendingSubscription = {
          ...request,
          id: subscriptionId,
          status: 'pending',
          requestId: subscriptionId,
          createdAt: expect.any(String),
        };

        // Verify that the subscription request was saved
        expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
          pendingSubscription,
        );

        // Verify that the connection request was sent
        expect(snap.request).toHaveBeenCalledWith({
          method: 'snap_sendWebSocketMessage',
          params: {
            id: mockConnectionId,
            message: JSON.stringify({
              jsonrpc: '2.0',
              id: subscriptionId,
              method: 'some-method',
              params: [],
            }),
          },
        });

        // Confirm the subscription
        const confirmationMessage = createMockConfirmationMessage(
          subscriptionId,
          98765,
        );
        await mockEventEmitter.emitSync(
          'onWebSocketEvent',
          confirmationMessage,
        );

        jest.spyOn(mockSubscriptionRepository, 'findBy').mockResolvedValue({
          ...pendingSubscription,
          status: 'confirmed',
          rpcSubscriptionId: 98765,
          confirmedAt: expect.any(String),
        });

        // Now, simulate a disconnection (this has no direct effect, it's just for clarity of the test)
        await simulateDisconnection(mockEventEmitter, mockConnectionId);

        // Simulate a reconnection
        await simulateReconnection(mockEventEmitter, mockConnectionId);

        // Verify that the subscription request was sent again
        expect(snap.request).toHaveBeenCalledWith({
          method: 'snap_sendWebSocketMessage',
          params: {
            id: mockConnectionId,
            message: JSON.stringify({
              jsonrpc: '2.0',
              id: subscriptionId,
              method: 'some-method',
              params: [],
            }),
          },
        });

        // Manually trigger the connection recovery callbacks since we can't mock the private method #handleWebSocketEvent
        await triggerConnectionRecoveryCallbacks(
          connectionRecoveryCallbacks,
          mockNetwork,
        );

        // Verify that the onConnectionRecovery callback was called
        expect(callbacks.onConnectionRecovery).toHaveBeenCalledWith();
      });
    });
  });
});
