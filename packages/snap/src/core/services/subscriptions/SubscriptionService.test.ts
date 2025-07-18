import type { WebSocketMessage } from '@metamask/snaps-sdk';

import type {
  ConfirmedSubscription,
  ConnectionRecoveryHandler,
  PendingSubscription,
  SubscriptionRequest,
  WebSocketConnection,
} from '../../../entities';
import { EventEmitter } from '../../../infrastructure';
import { Network } from '../../constants/solana';
import type { ConfigProvider } from '../config';
import { mockLogger } from '../mocks/logger';
import type { SubscriptionRepository } from './SubscriptionRepository';
import { SubscriptionService } from './SubscriptionService';
import type { WebSocketConnectionService } from './WebSocketConnectionService';

const createMockSubscriptionRequest = (
  method = 'accountSubscribe' as const,
  params = [],
  network = Network.Mainnet,
): SubscriptionRequest => ({
  method,
  params,
  network,
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

const createMockNotificationMessage = (
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
      method: 'accountNotification',
      params: { subscription: rpcSubscriptionId, result },
    }),
  },
});

const createMockFailureMessage = (
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

const triggerConnectionRecoveryHandlers = async (
  connectionRecoveryHandlers: Map<Network, ConnectionRecoveryHandler[]>,
  network: Network,
) => {
  const recoveryHandlers = connectionRecoveryHandlers.get(network) ?? [];
  await Promise.all(
    recoveryHandlers.map(async (handler) => {
      await handler(network);
    }),
  );
};

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let mockWebSocketConnectionService: WebSocketConnectionService;
  let mockSubscriptionRepository: SubscriptionRepository;
  let mockConfigProvider: ConfigProvider;
  let mockEventEmitter: EventEmitter;
  const connectionRecoveryHandlers: Map<Network, ConnectionRecoveryHandler[]> =
    new Map();

  const mockNetwork = Network.Mainnet;
  const mockConnectionId = 'some-connection-id';

  const mockConnection: WebSocketConnection = {
    id: mockConnectionId,
    url: 'wss://some-url',
    protocols: ['some-protocol'],
    network: mockNetwork,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;

    mockWebSocketConnectionService = {
      openConnection: jest.fn(),
      findById: jest.fn().mockReturnValue(mockConnection),
      findByNetwork: jest.fn().mockReturnValue(mockConnection),
      // Allows to capture the connection recovery handlers to trigger them manually
      onConnectionRecovery: jest.fn().mockImplementation((network, handler) => {
        connectionRecoveryHandlers.set(network, [
          ...(connectionRecoveryHandlers.get(network) ?? []),
          handler,
        ]);
      }),
      handleConnectionEvent: jest.fn(),
    } as unknown as WebSocketConnectionService;

    mockSubscriptionRepository = {
      getAll: jest.fn(),
      getById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findBy: jest.fn(),
    } as unknown as SubscriptionRepository;

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        activeNetworks: [Network.Mainnet, Network.Devnet],
      }),
    } as unknown as ConfigProvider;

    mockEventEmitter = new EventEmitter(mockLogger);

    service = new SubscriptionService(
      mockWebSocketConnectionService,
      mockSubscriptionRepository,
      mockConfigProvider,
      mockEventEmitter,
      mockLogger,
    );
  });

  describe('subscribe', () => {
    it('persists the subscription in state', async () => {
      const request = createMockSubscriptionRequest();

      await service.subscribe(request);

      expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
        }),
      );
    });

    describe('when the connection is open', () => {
      it('sends a subscribe message', async () => {
        jest.spyOn(snap, 'request').mockResolvedValueOnce(null);
        const request = createMockSubscriptionRequest();

        const subscriptionId = await service.subscribe(request);

        expect(snap.request).toHaveBeenCalledWith({
          method: 'snap_sendWebSocketMessage',
          params: {
            id: mockConnectionId,
            message: JSON.stringify({
              jsonrpc: '2.0',
              id: subscriptionId,
              method: 'accountSubscribe',
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
          message: expect.stringContaining('"method":"accountUnsubscribe"'),
        },
      });
    });
  });

  describe('#handleWebSocketEvent', () => {
    // describe('when the message is a notification', () => {
    //   describe('when there is no confirmed subscription for the message', () => {
    //     it('logs a warning and does nothing', async () => {
    //       jest
    //         .spyOn(mockSubscriptionRepository, 'getById')
    //         .mockResolvedValue(undefined);
    //       const notification = createMockNotification();

    //       await mockEventEmitter.emitSync('onWebSocketEvent', notification);

    //       expect(mockLogger.warn).toHaveBeenCalledWith(
    //         loggerScope,
    //         'Received a notification, but no matching confirmed subscription found for RPC subscription ID: 98765.',
    //       );
    //     });
    //   });

    //   describe('when there is a confirmed subscription for the message', () => {
    //     let request: SubscriptionRequest;
    //     // let callbacks: SubscriptionCallbacks;

    //     beforeEach(async () => {
    //       request = createMockSubscriptionRequest();
    //       //   callbacks = createMockSubscriptionCallbacks();

    //       const subscriptionId = await service.subscribe(request);

    //       const confirmationMessage = createMockConfirmationMessage(
    //         subscriptionId,
    //         98765,
    //       );

    //       await mockEventEmitter.emitSync('onWebSocketEvent', {
    //         event: confirmationMessage,
    //       });

    //       const confirmedSubscription: ConfirmedSubscription = {
    //         ...request,
    //         id: subscriptionId,
    //         rpcSubscriptionId: 98765,
    //         status: 'confirmed',
    //         requestId: subscriptionId,
    //         createdAt: '2024-01-01T00:00:00.000Z',
    //         confirmedAt: '2024-01-02T00:00:00.000Z',
    //       };

    //       jest
    //         .spyOn(mockSubscriptionRepository, 'findBy')
    //         .mockResolvedValue(confirmedSubscription);
    //     });

    //     it('handles a notification', async () => {
    //       const notification = createMockNotification(undefined, undefined, {
    //         context: { Slot: 348893275 },
    //         value: { lamports: 116044436802 },
    //       });

    //       await mockEventEmitter.emitSync('onWebSocketEvent', notification);

    //       //   expect(callbacks.onNotification).toHaveBeenCalledWith({
    //       //     context: { Slot: 348893275 },
    //       //     value: { lamports: 116044436802 },
    //       //   });
    //     });

    //     // it('catches errors on the subscription callback', async () => {
    //     //   const error = new Error('Subscription callback error');
    //     //   jest
    //     //     .spyOn(callbacks, 'onNotification')
    //     //     .mockImplementation()
    //     //     .mockRejectedValue(error);
    //     //   const notification = createMockNotification(undefined, undefined, {
    //     //     context: { Slot: 348893275 },
    //     //     value: { lamports: 116044436802 },
    //     //   });

    //     //   await mockEventEmitter.emitSync('onWebSocketEvent', notification);

    //     //   expect(mockLogger.error).toHaveBeenCalledWith(
    //     //     loggerScope,
    //     //     'Error in subscription callback for 98765:',
    //     //     error,
    //     //   );
    //     // });
    //   });
    // });

    describe('when the message is a subscription confirmation', () => {
      describe('when there is no subscription for the message', () => {
        it('does not update the subscription', async () => {
          const message = createMockConfirmationMessage('some-subscription-id');

          await mockEventEmitter.emitSync('onWebSocketEvent', message);

          expect(mockSubscriptionRepository.update).not.toHaveBeenCalled();
        });
      });

      describe('when there is a pending subscription for the message', () => {
        let request: SubscriptionRequest;
        let subscriptionId: string;
        let pendingSubscription: PendingSubscription;

        beforeEach(async () => {
          request = createMockSubscriptionRequest();
          subscriptionId = await service.subscribe(request);

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

          // Now we'll verify that notifications are now handled

          // Register a handler for the notification. We expect it to be called.
          const handler = jest.fn();
          service.registerNotificationHandler(
            'accountSubscribe',
            mockNetwork,
            handler,
          );

          jest
            .spyOn(mockSubscriptionRepository, 'findBy')
            .mockResolvedValue(confirmedSubscription);

          const notification = createMockNotificationMessage(
            confirmedSubscription.id,
            98765,
            {
              context: { Slot: 348893275 },
              value: { lamports: 116044436802 },
            },
          );

          await mockEventEmitter.emitSync('onWebSocketEvent', notification);

          const expectedNotification = {
            jsonrpc: '2.0',
            method: 'accountNotification',
            params: {
              result: {
                context: { Slot: 348893275 },
                value: { lamports: 116044436802 },
              },
              subscription: 98765,
            },
          };

          expect(handler).toHaveBeenCalledWith(
            expectedNotification,
            confirmedSubscription,
          );
        });
      });
    });

    describe('when the message is a failure', () => {
      describe('when it is a response to a specific request', () => {
        const message = createMockFailureMessage({
          code: -32000,
          message: 'Subscription error',
        });

        describe('when there is a pending subscription for the message', () => {
          let request: SubscriptionRequest;
          let subscriptionId: string;

          beforeEach(async () => {
            request = createMockSubscriptionRequest(); // request ID is 2 (request ID 1 was for opening the connection), hence why we createMockFailure with 2 as first argument
            subscriptionId = await service.subscribe(request);

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

          it('deletes the pending subscription', async () => {
            await mockEventEmitter.emitSync('onWebSocketEvent', message);

            expect(mockSubscriptionRepository.delete).toHaveBeenCalledWith(
              subscriptionId,
            );
          });
        });

        describe('when there is no pending subscription for the message', () => {
          it('does nothing', async () => {
            await mockEventEmitter.emitSync('onWebSocketEvent', message);

            expect(mockSubscriptionRepository.delete).not.toHaveBeenCalled();
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

        it('does nothing', async () => {
          await mockEventEmitter.emitSync('onWebSocketEvent', message);

          expect(mockSubscriptionRepository.delete).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('re-subscription scenarios', () => {
    // let connectionRecoveryHandlers: Map<
    //   Network,
    //   ((network: Network) => Promise<void>)[]
    // >;

    // beforeEach(() => {
    //   jest.clearAllMocks();

    // });

    describe('when a subscription request is sent, but no open connection', () => {
      it('saves the subscription request, and sends it once the connection is opened', async () => {
        // Mock findByNetwork to return null initially, then connection for re-subscription
        jest
          .spyOn(mockWebSocketConnectionService, 'findByNetwork')
          .mockResolvedValueOnce(null) // First call during subscribe() returns null
          .mockResolvedValue(mockConnection); // All subsequent calls return connection

        const request = createMockSubscriptionRequest();
        const subscriptionId = await service.subscribe(request);

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

        // Mock getAll to return the saved subscription for re-subscription
        jest
          .spyOn(mockSubscriptionRepository, 'getAll')
          .mockResolvedValue([pendingSubscription]);

        // Mock deleteMany for re-subscription flow
        jest
          .spyOn(mockSubscriptionRepository, 'deleteMany')
          .mockResolvedValue();

        // Send the connection event
        await simulateReconnection(mockEventEmitter, mockConnectionId);

        // Manually trigger the connection recovery handlers
        await triggerConnectionRecoveryHandlers(
          connectionRecoveryHandlers,
          mockNetwork,
        );

        // Verify that the subscription request was sent during re-subscription
        expect(snap.request).toHaveBeenCalledWith({
          method: 'snap_sendWebSocketMessage',
          params: {
            id: mockConnectionId,
            message: expect.stringContaining('"method":"accountSubscribe"'),
          },
        });
      });
    });

    //     describe('when the connection is lost BEFORE the subscription is confirmed', () => {
    //       it('re-sends the subscription request when the connection is reestablished', async () => {
    //         const request = createMockSubscriptionRequest();
    //         const handlers = createMockSubscriptionHandlers();
    //         const subscriptionId = await service.subscribe(request, handlers);

    //         const pendingSubscription: PendingSubscription = {
    //           ...request,
    //           id: subscriptionId,
    //           status: 'pending',
    //           requestId: subscriptionId,
    //           createdAt: expect.any(String),
    //         };

    //         // Verify that the subscription request was saved
    //         expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
    //           pendingSubscription,
    //         );

    //         // Verify that the connection request was sent
    //         expect(snap.request).toHaveBeenCalledWith({
    //           method: 'snap_sendWebSocketMessage',
    //           params: {
    //             id: mockConnectionId,
    //             message: JSON.stringify({
    //               jsonrpc: '2.0',
    //               id: subscriptionId,
    //               method: 'some-method',
    //               params: [],
    //             }),
    //           },
    //         });

    //         // Do not confirm the subscription yet

    //         // Now, simulate a disconnection (this has no direct effect, it's just for clarity of the test)
    //         await simulateDisconnection(mockEventEmitter, mockConnectionId);

    //         // Simulate a reconnection
    //         await simulateReconnection(mockEventEmitter, mockConnectionId);

    //         // Manually trigger the connection recovery callbacks since we can't mock the private method #handleWebSocketEvent
    //         await triggerConnectionRecoveryHandlers(
    //           connectionRecoveryHandlers,
    //           mockNetwork,
    //         );

    //         // Verify that the subscription request was sent again
    //         expect(snap.request).toHaveBeenCalledWith({
    //           method: 'snap_sendWebSocketMessage',
    //           params: {
    //             id: mockConnectionId,
    //             message: JSON.stringify({
    //               jsonrpc: '2.0',
    //               id: subscriptionId,
    //               method: 'some-method',
    //               params: [],
    //             }),
    //           },
    //         });

    //         // Verify that the onConnectionRecovery handler was called
    //         expect(handlers.onConnectionRecovery).toHaveBeenCalledWith();
    //       });
    //     });

    //     describe('when the connection is lost AFTER the subscription is confirmed', () => {
    //       it('re-sends the subscription request when the connection is reestablished', async () => {
    //         const request = createMockSubscriptionRequest();
    //         const handlers = createMockSubscriptionHandlers();
    //         const subscriptionId = await service.subscribe(request, handlers);

    //         const pendingSubscription: PendingSubscription = {
    //           ...request,
    //           id: subscriptionId,
    //           status: 'pending',
    //           requestId: subscriptionId,
    //           createdAt: expect.any(String),
    //         };

    //         // Verify that the subscription request was saved
    //         expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
    //           pendingSubscription,
    //         );

    //         // Verify that the connection request was sent
    //         expect(snap.request).toHaveBeenCalledWith({
    //           method: 'snap_sendWebSocketMessage',
    //           params: {
    //             id: mockConnectionId,
    //             message: JSON.stringify({
    //               jsonrpc: '2.0',
    //               id: subscriptionId,
    //               method: 'some-method',
    //               params: [],
    //             }),
    //           },
    //         });

    //         // Confirm the subscription
    //         const confirmationMessage = createMockConfirmationMessage(
    //           subscriptionId,
    //           98765,
    //         );
    //         await mockEventEmitter.emitSync(
    //           'onWebSocketEvent',
    //           confirmationMessage,
    //         );

    //         jest.spyOn(mockSubscriptionRepository, 'findBy').mockResolvedValue({
    //           ...pendingSubscription,
    //           status: 'confirmed',
    //           rpcSubscriptionId: 98765,
    //           confirmedAt: expect.any(String),
    //         });

    //         // Now, simulate a disconnection (this has no direct effect, it's just for clarity of the test)
    //         await simulateDisconnection(mockEventEmitter, mockConnectionId);

    //         // Simulate a reconnection
    //         await simulateReconnection(mockEventEmitter, mockConnectionId);

    //         // Verify that the subscription request was sent again
    //         expect(snap.request).toHaveBeenCalledWith({
    //           method: 'snap_sendWebSocketMessage',
    //           params: {
    //             id: mockConnectionId,
    //             message: JSON.stringify({
    //               jsonrpc: '2.0',
    //               id: subscriptionId,
    //               method: 'some-method',
    //               params: [],
    //             }),
    //           },
    //         });

    //         // Manually trigger the connection recovery callbacks since we can't mock the private method #handleWebSocketEvent
    //         await triggerConnectionRecoveryHandlers(
    //           connectionRecoveryHandlers,
    //           mockNetwork,
    //         );

    //         // Verify that the onConnectionRecovery handler was called
    //         expect(handlers.onConnectionRecovery).toHaveBeenCalledWith();
    //       });
    //     });
  });
});
