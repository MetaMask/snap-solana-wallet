import { Network } from '../../core/constants/solana';
import type { ConfigProvider } from '../../core/services/config';
import type {
  Config,
  NetworkWithRpcUrls,
} from '../../core/services/config/ConfigProvider';
import { mockLogger } from '../../core/services/mocks/logger';
import { ConnectionManagerAdapter } from './ConnectionManagerAdapter';
import type { ConnectionRepository } from './ConnectionRepository';

describe('ConnectionManagerAdapter', () => {
  let connectionManager: ConnectionManagerAdapter;
  let mockConnectionRepository: ConnectionRepository;
  let mockConfigProvider: ConfigProvider;
  const mockWebSocketUrl = 'wss://some-mock-url.com';
  const mockConnectionId = 'mock-connection-id';

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnectionRepository = {
      getAll: jest.fn(),
      getById: jest.fn(),
      findByUrl: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      getIdByUrl: jest.fn(),
      getUrlById: jest.fn(),
    } as unknown as ConnectionRepository;

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        subscription: {
          maxReconnectAttempts: 5,
          reconnectDelayMilliseconds: 1, // To speed up the tests
        },
      }),
      getNetworkBy: jest.fn().mockReturnValue({
        rpcUrls: [mockWebSocketUrl],
      }),
    } as unknown as ConfigProvider;

    connectionManager = new ConnectionManagerAdapter(
      mockConnectionRepository,
      mockConfigProvider,
      mockLogger,
    );
  });

  describe('openConnection', () => {
    describe('when the connection does not already exist', () => {
      describe('when the connection succeeds', () => {
        it('opens a connection', async () => {
          jest
            .spyOn(mockConnectionRepository, 'getAll')
            .mockResolvedValueOnce([]);

          jest
            .spyOn(mockConnectionRepository, 'save')
            .mockResolvedValueOnce(mockConnectionId);

          const connectionId = await connectionManager.openConnection(
            Network.Mainnet,
          );

          expect(connectionId).toBe(mockConnectionId);
        });
      });

      describe('when the connection fails', () => {
        it('retries until it succeeds, when attempts < 5', async () => {
          jest
            .spyOn(mockConnectionRepository, 'getAll')
            .mockResolvedValueOnce([]);

          jest
            .spyOn(mockConnectionRepository, 'save')
            .mockRejectedValueOnce(new Error('Connection failed')) // 1st call is the fail attempt
            .mockResolvedValueOnce(mockConnectionId); // 2nd call is the success attempt

          const connectionId = await connectionManager.openConnection(
            Network.Mainnet,
          );

          expect(mockConnectionRepository.save).toHaveBeenCalledTimes(2);
          expect(connectionId).toBe(mockConnectionId);
        });

        it('does not retry more than the max number of attempts', async () => {
          jest
            .spyOn(mockConnectionRepository, 'getAll')
            .mockResolvedValueOnce([]);

          jest
            .spyOn(mockConnectionRepository, 'save')
            .mockRejectedValue(new Error('Connection failed'));

          await expect(
            connectionManager.openConnection(Network.Mainnet),
          ).rejects.toThrow('Connection failed');

          expect(mockConnectionRepository.save).toHaveBeenCalledTimes(5);
        });
      });
    });

    describe('when the connection already exists', () => {
      beforeEach(async () => {
        jest
          .spyOn(mockConnectionRepository, 'findByUrl')
          .mockResolvedValueOnce({
            id: mockConnectionId,
            url: mockWebSocketUrl,
            protocols: [],
          });

        jest
          .spyOn(mockConnectionRepository, 'save')
          .mockResolvedValueOnce(mockConnectionId);
      });

      it('returns the existing connection ID', async () => {
        const connectionId = await connectionManager.openConnection(
          Network.Mainnet,
        );

        expect(connectionId).toBe(mockConnectionId);
      });

      it('does not open a new connection', async () => {
        await connectionManager.openConnection(Network.Mainnet);

        expect(mockConnectionRepository.save).not.toHaveBeenCalled();
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
      beforeEach(async () => {
        jest
          .spyOn(mockConnectionRepository, 'getAll')
          .mockResolvedValueOnce([]);
      });

      it('does nothing', async () => {
        await connectionManager.closeConnection(Network.Mainnet);

        expect(mockConnectionRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('when the connection exists', () => {
      beforeEach(async () => {
        jest
          .spyOn(mockConnectionRepository, 'findByUrl')
          .mockResolvedValueOnce({
            id: mockConnectionId,
            url: mockWebSocketUrl,
            protocols: [],
          });

        jest
          .spyOn(mockConnectionRepository, 'delete')
          .mockResolvedValueOnce(undefined);
      });

      it('closes the connection', async () => {
        await connectionManager.closeConnection(Network.Mainnet);

        expect(mockConnectionRepository.delete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('setupAllConnections', () => {
    it('opens the connections for the active networks that are not already open', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet, Network.Devnet],
      } as unknown as Config);

      jest.spyOn(mockConnectionRepository, 'getAll').mockResolvedValueOnce([]);

      jest
        .spyOn(mockConnectionRepository, 'save')
        .mockResolvedValueOnce(mockConnectionId);

      await connectionManager.setupAllConnections();

      expect(mockConnectionRepository.save).toHaveBeenCalledTimes(2);
    });

    it('does nothing for active networks that are already open', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);

      jest.spyOn(mockConfigProvider, 'getNetworkBy').mockReturnValueOnce({
        rpcUrls: [mockWebSocketUrl],
      } as unknown as NetworkWithRpcUrls);

      jest.spyOn(mockConnectionRepository, 'getAll').mockResolvedValueOnce([
        {
          id: mockConnectionId,
          url: mockWebSocketUrl,
          protocols: [],
        },
      ]);

      await connectionManager.setupAllConnections();

      expect(mockConnectionRepository.save).toHaveBeenCalledTimes(0);
    });

    it('closes the connections for the inactive networks that are open', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [],
      } as unknown as Config);

      const openConnection = {
        id: mockConnectionId,
        url: mockWebSocketUrl,
        protocols: [],
      };

      jest
        .spyOn(mockConnectionRepository, 'getAll')
        .mockResolvedValueOnce([openConnection]);

      jest
        .spyOn(mockConnectionRepository, 'findByUrl')
        .mockResolvedValueOnce(openConnection);

      await connectionManager.setupAllConnections();

      expect(mockConnectionRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('does nothing for inactive networks that are not open', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [],
      } as unknown as Config);

      jest.spyOn(mockConnectionRepository, 'getAll').mockResolvedValueOnce([]);

      await connectionManager.setupAllConnections();

      expect(mockConnectionRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('handleConnectionEvent', () => {
    describe('when the event is a connect', () => {
      beforeEach(async () => {
        const mockConnection = {
          id: mockConnectionId,
          url: mockWebSocketUrl,
          protocols: [],
        };

        jest
          .spyOn(mockConnectionRepository, 'findByUrl')
          .mockResolvedValue(mockConnection);

        jest
          .spyOn(mockConnectionRepository, 'getById')
          .mockResolvedValue(mockConnection);
      });

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
          mockConnectionId,
          'connected',
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

    describe('when the event is a disconnect', () => {
      beforeEach(async () => {
        jest
          .spyOn(mockConnectionRepository, 'getAll')
          .mockResolvedValueOnce([
            { id: mockConnectionId, url: mockWebSocketUrl, protocols: [] },
          ]);

        await connectionManager.openConnection(Network.Mainnet);
      });

      it('attempts to reconnect', async () => {
        jest
          .spyOn(connectionManager, 'openConnection')
          .mockResolvedValue(mockConnectionId);

        jest.spyOn(mockConnectionRepository, 'getById').mockResolvedValueOnce({
          id: mockConnectionId,
          url: mockWebSocketUrl,
          protocols: [],
        });

        await connectionManager.handleConnectionEvent(
          mockConnectionId,
          'disconnected',
        );

        expect(connectionManager.openConnection).toHaveBeenCalledWith(
          Network.Mainnet,
        );
      });
    });
  });

  describe('getConnectionIdByNetwork', () => {
    it('returns the connection ID for the network', async () => {
      jest
        .spyOn(mockConnectionRepository, 'getIdByUrl')
        .mockReturnValue(mockConnectionId);

      const connectionId = connectionManager.getConnectionIdByNetwork(
        Network.Mainnet,
      );

      expect(connectionId).toBe(mockConnectionId);
    });
  });
});
