import { Network } from '../../../core/constants/solana';
import type { ConfigProvider } from '../../../core/services/config';
import type { NetworkWithRpcUrls } from '../../../core/services/config/ConfigProvider';
import { mockLogger } from '../../../core/services/mocks/logger';
import { WebSocketConnectionManagerAdapter } from './WebSocketConnectionManagerAdapter';

describe('WebSocketConnectionManagerAdapter', () => {
  let connectionManager: WebSocketConnectionManagerAdapter;
  let mockConfigProvider: ConfigProvider;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigProvider = {
      getNetworkBy: jest.fn().mockReturnValue({
        rpcUrls: ['wss://some-mock-url.com'],
      }),
    } as unknown as ConfigProvider;

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;

    connectionManager = new WebSocketConnectionManagerAdapter(
      mockConfigProvider,
      mockLogger,
    );
  });

  describe('openConnection', () => {
    describe('when the connection does not already exist', () => {
      describe('when the connection succeeds', () => {
        it('opens a connection', async () => {
          jest
            .spyOn(snap, 'request')
            .mockResolvedValue(globalThis.crypto.randomUUID());

          const connectionId = await connectionManager.openConnection(
            Network.Mainnet,
          );

          expect(connectionId).toBeDefined();
        });
      });

      describe('when the connection fails', () => {
        it('retries until it succeeds, when attempts < 5', async () => {
          jest
            .spyOn(snap, 'request')
            .mockRejectedValueOnce(new Error('Connection failed'))
            .mockResolvedValue(globalThis.crypto.randomUUID());

          // Start the connection attempt (don't await yet)
          await connectionManager.openConnection(Network.Mainnet);

          // First call is the fail attempt, secondis the retry
          expect(snap.request).toHaveBeenCalledTimes(2);
        });
      });
    });

    describe('when the connection already exists', () => {
      let existingConnectionId: string;
      let spy: jest.SpyInstance;

      beforeEach(async () => {
        spy = jest
          .spyOn(snap, 'request')
          .mockResolvedValue(globalThis.crypto.randomUUID());

        existingConnectionId = await connectionManager.openConnection(
          Network.Mainnet,
        );
      });

      it('returns the existing connection ID', async () => {
        const connectionId = await connectionManager.openConnection(
          Network.Mainnet,
        );

        expect(connectionId).toBe(existingConnectionId);
      });

      it('does not open a new connection', async () => {
        await connectionManager.openConnection(Network.Mainnet);

        // snap.request should have been called only once, on the first openConnection call
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe('when the config misses the RPC URL', () => {
      it('throws an error', async () => {
        jest.spyOn(mockConfigProvider, 'getNetworkBy').mockReturnValue({
          rpcUrls: [],
        } as unknown as NetworkWithRpcUrls);

        await expect(
          connectionManager.openConnection(Network.Mainnet),
        ).rejects.toThrow(
          'No RPC URL found for network solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        );
      });
    });
  });

  describe('closeConnection', () => {
    describe('when the connection does not exist', () => {
      it('does nothing', async () => {
        await connectionManager.closeConnection(Network.Mainnet);

        expect(snap.request).not.toHaveBeenCalled();
      });
    });

    describe('when the connection exists', () => {
      beforeEach(async () => {
        await connectionManager.openConnection(Network.Mainnet);
      });

      it('closes the connection', async () => {
        await connectionManager.closeConnection(Network.Mainnet);

        expect(snap.request).toHaveBeenCalled();
      });
    });
  });

  describe('handleConnectionEvent', () => {
    describe('when the connection does not exist', () => {
      it('does nothing', async () => {
        await connectionManager.handleConnectionEvent(
          'some-mock-connection-id',
          'disconnect',
        );

        expect(mockLogger.warn).toHaveBeenCalledWith(
          '[WebSocketJsonRpcSubscriptionAdapter] No connection found for event: disconnect',
        );
      });
    });

    describe('when the connection exists', () => {
      let connectionId: string;

      beforeEach(async () => {
        connectionId = await connectionManager.openConnection(Network.Mainnet);
      });

      describe('when the event is a disconnect', () => {
        it('attempts to reconnect', async () => {
          jest
            .spyOn(connectionManager, 'openConnection')
            .mockResolvedValue(connectionId);

          await connectionManager.handleConnectionEvent(
            connectionId,
            'disconnect',
          );

          expect(connectionManager.openConnection).toHaveBeenCalledWith(
            Network.Mainnet,
          );
        });
      });

      describe('when the event is a error', () => {
        it('attempts to reconnect', async () => {
          jest
            .spyOn(connectionManager, 'openConnection')
            .mockResolvedValue(connectionId);

          await connectionManager.handleConnectionEvent(connectionId, 'error');

          expect(connectionManager.openConnection).toHaveBeenCalledWith(
            Network.Mainnet,
          );
        });
      });

      describe('when the event is a connect', () => {
        it('triggers all the recovery callbacks', async () => {
          const recoveryCallback0 = jest.fn();
          const recoveryCallback1 = jest.fn();
          const recoveryCallback2 = jest.fn();
          const recoveryCallback3 = jest.fn();
          connectionManager.onConnectionRecovery(recoveryCallback0);
          connectionManager.onConnectionRecovery(recoveryCallback1);
          connectionManager.onConnectionRecovery(recoveryCallback2);
          connectionManager.onConnectionRecovery(recoveryCallback3);

          //   const connectionId = globalThis.crypto.randomUUID();

          //   // Set up some pending and active subscriptions
          //   const pendingSubscription0 = createMockSubscription('pending-0');
          //   const pendingSubscription1 = createMockSubscription('pending-1');
          //   const activeSubscription0 = createMockSubscription('active-0');
          //   const activeSubscription1 = createMockSubscription('active-1');

          // Init the subscriptions
          //   await adapter.subscribe(connectionId, pendingSubscription0); // Request ID 1
          //   await adapter.subscribe(connectionId, pendingSubscription1); // Request ID 2
          //   await adapter.subscribe(connectionId, activeSubscription0); // Request ID 3
          //   await adapter.subscribe(connectionId, activeSubscription1); // Request ID 4

          // Confirm the subscriptions we want active
          //   const confirmationMessage0 = createMockConfirmationMessage(3, 98765);
          //   const confirmationMessage1 = createMockConfirmationMessage(4, 98766);
          //   await adapter.handleMessage(connectionId, confirmationMessage0);
          //   await adapter.handleMessage(connectionId, confirmationMessage1);

          //   const subscribeSpy = jest.spyOn(adapter, 'subscribe');

          // Send the connect event
          await connectionManager.handleConnectionEvent(
            connectionId,
            'connect',
          );

          //   // Verify that we requested to re-establish ALL subscriptions
          //   expect(subscribeSpy).toHaveBeenCalledTimes(4);
          //   expect(subscribeSpy).toHaveBeenCalledWith(pendingSubscription0);
          //   expect(subscribeSpy).toHaveBeenCalledWith(pendingSubscription1);
          //   expect(subscribeSpy).toHaveBeenCalledWith(activeSubscription0);
          //   expect(subscribeSpy).toHaveBeenCalledWith(activeSubscription1);
          expect(recoveryCallback0).toHaveBeenCalled();
          expect(recoveryCallback1).toHaveBeenCalled();
          expect(recoveryCallback2).toHaveBeenCalled();
          expect(recoveryCallback3).toHaveBeenCalled();
        });
      });
    });
  });
});
