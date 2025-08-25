import type { WebSocketConnection } from '../../../entities';
import { EventEmitter } from '../../../infrastructure';
import { Network } from '../../constants/solana';
import type { ConfigProvider } from '../config';
import type { Config, NetworkConfig } from '../config/ConfigProvider';
import { mockLogger } from '../mocks/logger';
import type { WebSocketConnectionRepository } from './WebSocketConnectionRepository';
import { WebSocketConnectionService } from './WebSocketConnectionService';

const mockWebSocketUrl = 'wss://some-mock-url.com/ws/v3/some-id';
const mockConnectionId = 'mock-connection-id';

const createMockWebSocketConnection = (
  id = mockConnectionId,
  url = mockWebSocketUrl,
  network = Network.Mainnet,
): WebSocketConnection => ({
  id,
  url,
  protocols: [],
  network,
});

describe('WebSocketConnectionService', () => {
  let service: WebSocketConnectionService;
  let mockWebSocketConnectionRepository: WebSocketConnectionRepository;
  let mockConfigProvider: ConfigProvider;
  let mockEventEmitter: EventEmitter;

  const mockNetworksConfig = [
    {
      caip2Id: Network.Mainnet,
      webSocketUrl: mockWebSocketUrl,
    },
    {
      caip2Id: Network.Devnet,
      webSocketUrl: 'wss://some-mock-url2.com/ws/v3/some-id',
    },
    {
      caip2Id: Network.Testnet,
      webSocketUrl: 'wss://some-mock-url3.com/ws/v3/some-id',
    },
    {
      caip2Id: Network.Localnet,
      webSocketUrl: 'wss://some-mock-url4.com/ws/v3/some-id',
    },
  ] as NetworkConfig[];

  beforeEach(() => {
    jest.clearAllMocks();

    mockWebSocketConnectionRepository = {
      getAll: jest.fn(),
      getById: jest.fn(),
      findByNetwork: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as WebSocketConnectionRepository;

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        networks: mockNetworksConfig,
        activeNetworks: [Network.Mainnet, Network.Devnet],
        subscriptions: {
          maxReconnectAttempts: 5,
          reconnectDelayMilliseconds: 1, // To speed up the tests
        },
      }),
      getNetworkBy: jest.fn().mockImplementation((key, value) => {
        return mockNetworksConfig.find(
          (item) => item[key as keyof NetworkConfig] === value,
        );
      }),
    } as unknown as ConfigProvider;

    mockEventEmitter = new EventEmitter(mockLogger);

    service = new WebSocketConnectionService(
      mockWebSocketConnectionRepository,
      mockConfigProvider,
      mockEventEmitter,
      mockLogger,
    );
  });

  describe('#openConnectionsForActiveNetworks', () => {
    it('opens the connections for all active networks', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet, Network.Devnet],
      } as unknown as Config);

      jest.spyOn(service, 'openConnection').mockResolvedValueOnce(undefined);

      // Simulate the snap start event
      await mockEventEmitter.emitSync('onStart');

      expect(service.openConnection).toHaveBeenCalledTimes(2);
    });

    it('clears existing retry attempts', async () => {
      // We register a recovery handler for Mainnet. We expect it to be cleared when the method is executed.
      const recoveryHandler = jest.fn();
      service.onConnectionRecovery(Network.Mainnet, recoveryHandler);

      /**
       * Setup Mainnet as active network, but it has no connection, so calling openConnectionsForActiveNetworks will:
       * - clear the retry attempts
       * - open the connection
       * - upon opening, we will trigger all recovery handlers
       * - but since retry attempts have been cleared, they should not have been called
       */
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);
      jest
        .spyOn(mockWebSocketConnectionRepository, 'getAll')
        .mockResolvedValueOnce([]);
      jest
        .spyOn(mockWebSocketConnectionRepository, 'findByNetwork')
        .mockResolvedValueOnce(null);

      // Simulate the snap start event
      await mockEventEmitter.emitSync('onStart');

      // The connection has recovered, but the recovery handler should not have been called because retry attempts were cleared
      expect(recoveryHandler).not.toHaveBeenCalled();
    });
  });

  describe('#closeAllConnections', () => {
    it('closes all connections when extension becomes inactive', async () => {
      const mockConnections = [
        createMockWebSocketConnection(
          'conn1',
          mockWebSocketUrl,
          Network.Mainnet,
        ),
        createMockWebSocketConnection(
          'conn2',
          'wss://other-url.com',
          Network.Devnet,
        ),
      ];

      jest
        .spyOn(mockWebSocketConnectionRepository, 'getAll')
        .mockResolvedValue(mockConnections);

      // Simulate the extension becoming inactive
      await mockEventEmitter.emitSync('onInactive');

      expect(mockWebSocketConnectionRepository.delete).toHaveBeenCalledTimes(2);
      expect(mockWebSocketConnectionRepository.delete).toHaveBeenCalledWith(
        'conn1',
      );
      expect(mockWebSocketConnectionRepository.delete).toHaveBeenCalledWith(
        'conn2',
      );
    });

    it('continues closing other connections even if one fails', async () => {
      const mockConnections = [
        createMockWebSocketConnection(
          'conn1',
          mockWebSocketUrl,
          Network.Mainnet,
        ),
        createMockWebSocketConnection(
          'conn2',
          'wss://other-url.com',
          Network.Devnet,
        ),
        createMockWebSocketConnection(
          'conn3',
          'wss://third-url.com',
          Network.Testnet,
        ),
      ];

      jest
        .spyOn(mockWebSocketConnectionRepository, 'getAll')
        .mockResolvedValue(mockConnections);

      // Mock one connection to fail deletion
      jest
        .spyOn(mockWebSocketConnectionRepository, 'delete')
        .mockRejectedValueOnce(new Error('Failed to delete connection'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Simulate the extension becoming inactive
      await mockEventEmitter.emitSync('onInactive');

      // Should attempt to delete all connections despite one failing
      expect(mockWebSocketConnectionRepository.delete).toHaveBeenCalledTimes(3);
      expect(mockWebSocketConnectionRepository.delete).toHaveBeenCalledWith(
        'conn1',
      );
      expect(mockWebSocketConnectionRepository.delete).toHaveBeenCalledWith(
        'conn2',
      );
      expect(mockWebSocketConnectionRepository.delete).toHaveBeenCalledWith(
        'conn3',
      );
    });
  });

  describe('openConnection', () => {
    it('opens the connection for the network', async () => {
      jest
        .spyOn(mockWebSocketConnectionRepository, 'findByNetwork')
        .mockResolvedValue(null);

      await service.openConnection(Network.Mainnet);

      expect(mockWebSocketConnectionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('does nothing if the connection already exists', async () => {
      jest
        .spyOn(mockWebSocketConnectionRepository, 'findByNetwork')
        .mockResolvedValue(createMockWebSocketConnection());

      await service.openConnection(Network.Mainnet);

      expect(mockWebSocketConnectionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('#handleWebSocketEvent', () => {
    describe('when the event is a connect', () => {
      beforeEach(async () => {
        const mockConnection = createMockWebSocketConnection();

        jest
          .spyOn(mockWebSocketConnectionRepository, 'getById')
          .mockResolvedValue(mockConnection);

        jest
          .spyOn(mockWebSocketConnectionRepository, 'findByNetwork')
          .mockResolvedValueOnce(mockConnection);
      });

      it('triggers all the recovery handlers', async () => {
        const recoveryHandler0 = jest.fn();
        const recoveryHandler1 = jest.fn();

        service.onConnectionRecovery(Network.Mainnet, recoveryHandler0);
        service.onConnectionRecovery(Network.Mainnet, recoveryHandler1);

        // Send the connect event
        await mockEventEmitter.emitSync('onWebSocketEvent', {
          id: mockConnectionId,
          type: 'open',
        });

        expect(recoveryHandler0).toHaveBeenCalled();
        expect(recoveryHandler1).toHaveBeenCalled();
      });
    });

    describe('when the event is a disconnect', () => {
      beforeEach(async () => {
        const mockConnection = createMockWebSocketConnection();

        jest
          .spyOn(mockWebSocketConnectionRepository, 'getAll')
          .mockResolvedValueOnce([mockConnection]);

        jest
          .spyOn(mockWebSocketConnectionRepository, 'getById')
          .mockResolvedValueOnce(mockConnection);
      });

      it('does not attempt to reconnect when connection is closed cleanly', async () => {
        // Send a clean disconnect event
        await mockEventEmitter.emitSync('onWebSocketEvent', {
          id: mockConnectionId,
          type: 'close',
          wasClean: true,
          origin: 'wss://some-mock-url.com',
        });

        // Should not attempt to reconnect for clean closures
        expect(mockWebSocketConnectionRepository.save).not.toHaveBeenCalled();
      });

      it('attempts to reconnect until it succeeds, up to max attempts', async () => {
        // 1st and 2nd calls are the fail attempts, 3rd is the success attempt
        jest
          .spyOn(mockWebSocketConnectionRepository, 'save')
          .mockRejectedValueOnce(new Error('Connection failed'))
          .mockRejectedValueOnce(new Error('Connection failed'))
          .mockResolvedValueOnce(createMockWebSocketConnection());

        // Send the initial disconnect event
        await mockEventEmitter.emitSync('onWebSocketEvent', {
          id: mockConnectionId,
          type: 'close',
          wasClean: false,
          origin: 'wss://some-mock-url.com',
        });

        // The first 2 attemps at reconnecting will fail. Each failure will emit its own disconnect event.
        await mockEventEmitter.emitSync('onWebSocketEvent', {
          id: mockConnectionId,
          type: 'close',
          wasClean: false,
          origin: 'wss://some-mock-url.com',
        });
        await mockEventEmitter.emitSync('onWebSocketEvent', {
          id: mockConnectionId,
          type: 'close',
          wasClean: false,
          origin: 'wss://some-mock-url.com',
        });
        // The 3rd attempt at reconnecting will succeed. This will emit a connect event.
        await mockEventEmitter.emitSync('onWebSocketEvent', {
          id: mockConnectionId,
          type: 'open',
          origin: 'wss://some-mock-url.com',
        });

        expect(mockWebSocketConnectionRepository.save).toHaveBeenCalledTimes(3);
      });

      it('retries up to the max number of attempts', async () => {
        jest
          .spyOn(mockWebSocketConnectionRepository, 'save')
          .mockRejectedValue(new Error('Connection failed'));

        // Send the initial disconnect event
        await mockEventEmitter.emitSync('onWebSocketEvent', {
          id: mockConnectionId,
          type: 'close',
          wasClean: false,
          origin: 'wss://some-mock-url.com',
        });

        // Send many disconnect events, more than the max number of attempts
        for (let i = 0; i < 10; i++) {
          await mockEventEmitter.emitSync('onWebSocketEvent', {
            id: mockConnectionId,
            type: 'close',
            wasClean: false,
            origin: 'wss://some-mock-url.com',
          });
        }

        // Check that we do not retry more than the max
        expect(mockWebSocketConnectionRepository.save).toHaveBeenCalledTimes(5);
      });
    });
  });

  describe('findByNetwork', () => {
    it('returns the connection ID for the network', async () => {
      const mockConnection = createMockWebSocketConnection();
      jest
        .spyOn(mockWebSocketConnectionRepository, 'findByNetwork')
        .mockResolvedValueOnce(mockConnection);

      const connection = await service.findByNetwork(Network.Mainnet);

      expect(connection).toStrictEqual(mockConnection);
    });
  });
});
