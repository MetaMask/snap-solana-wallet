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
        subscription: {
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

  describe('#setupAllConnections', () => {
    it('opens the connections for the active networks that are not already open', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet, Network.Devnet],
      } as unknown as Config);

      // Init with an existing connection for Mainnet. We expect to only open the connection for Devnet.
      const mockConnectionMainnet = createMockWebSocketConnection();

      jest
        .spyOn(mockWebSocketConnectionRepository, 'getAll')
        .mockResolvedValueOnce([mockConnectionMainnet]);

      jest
        .spyOn(mockWebSocketConnectionRepository, 'save')
        .mockResolvedValueOnce(mockConnectionMainnet);

      // Simulate the snap start event
      await mockEventEmitter.emitSync('onStart');

      expect(mockWebSocketConnectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockWebSocketConnectionRepository.save).toHaveBeenCalledWith({
        network: Network.Devnet,
        url: 'wss://some-mock-url2.com/ws/v3/some-id',
        protocols: [],
      });
    });

    it('does nothing for active networks that are already open', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);

      const mockConnection = createMockWebSocketConnection();

      jest
        .spyOn(mockWebSocketConnectionRepository, 'getAll')
        .mockResolvedValueOnce([mockConnection]);

      // Simulate the snap start event
      await mockEventEmitter.emitSync('onStart');

      expect(mockWebSocketConnectionRepository.save).toHaveBeenCalledTimes(0);
    });

    it('closes the connections for the inactive networks that are open', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [],
      } as unknown as Config);

      const openConnection = createMockWebSocketConnection();

      jest
        .spyOn(mockWebSocketConnectionRepository, 'getAll')
        .mockResolvedValueOnce([openConnection]);

      jest
        .spyOn(mockWebSocketConnectionRepository, 'findByNetwork')
        .mockResolvedValueOnce(openConnection);

      // Simulate the snap start event
      await mockEventEmitter.emitSync('onStart');

      expect(mockWebSocketConnectionRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('does nothing for inactive networks that are not open', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [],
      } as unknown as Config);

      jest
        .spyOn(mockWebSocketConnectionRepository, 'getAll')
        .mockResolvedValueOnce([]);

      // Simulate the snap start event
      await mockEventEmitter.emitSync('onStart');

      expect(mockWebSocketConnectionRepository.delete).not.toHaveBeenCalled();
    });

    it('clears existing recovery callbacks', async () => {
      // We register a recovery callback for Mainnet. We expect it to be cleared when the method is executed.
      const recoveryCallback = jest.fn();
      service.onConnectionRecovery(Network.Mainnet, recoveryCallback);

      /**
       * Setup Mainnet as active network, but it has no connection, so calling setupAllConnections will:
       * - clear the recovery callback
       * - open the connection
       * - upon opening, we will trigger all recovery callbacks
       * - but since they have been cleared, they should not be called
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

      // The connection has recovered, but the recovery callback should not have been called because it was cleared
      expect(recoveryCallback).not.toHaveBeenCalled();
    });

    describe('when the connection fails', () => {
      beforeEach(() => {
        jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
          activeNetworks: [Network.Mainnet],
        } as unknown as Config);

        jest
          .spyOn(mockWebSocketConnectionRepository, 'getAll')
          .mockResolvedValueOnce([]);
      });

      it('retries until it succeeds, when attempts < 5', async () => {
        const mockConnection = createMockWebSocketConnection();

        jest
          .spyOn(mockWebSocketConnectionRepository, 'save')
          .mockRejectedValueOnce(new Error('Connection failed')) // 1st call is the fail attempt
          .mockResolvedValueOnce(mockConnection); // 2nd call is the success attempt

        // Simulate the snap start event
        await mockEventEmitter.emitSync('onStart');

        expect(mockWebSocketConnectionRepository.save).toHaveBeenCalledTimes(2);
      });

      it('retries up to the max number of attempts', async () => {
        jest
          .spyOn(mockWebSocketConnectionRepository, 'save')
          .mockRejectedValue(new Error('Connection failed'));

        // Simulate the snap start event
        await mockEventEmitter.emitSync('onStart');

        expect(mockWebSocketConnectionRepository.save).toHaveBeenCalledTimes(5);
      });
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

      it('triggers all the recovery callbacks', async () => {
        const recoveryCallback0 = jest.fn();
        const recoveryCallback1 = jest.fn();

        service.onConnectionRecovery(Network.Mainnet, recoveryCallback0);
        service.onConnectionRecovery(Network.Mainnet, recoveryCallback1);

        // Send the connect event
        await mockEventEmitter.emitSync('onWebSocketEvent', {
          id: mockConnectionId,
          type: 'open',
        });

        expect(recoveryCallback0).toHaveBeenCalled();
        expect(recoveryCallback1).toHaveBeenCalled();
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

      it('attempts to reconnect', async () => {
        // Send the connect event
        await mockEventEmitter.emitSync('onWebSocketEvent', {
          id: mockConnectionId,
          type: 'close',
        });

        expect(mockWebSocketConnectionRepository.save).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('getConnectionIdByNetwork', () => {
    it('returns the connection ID for the network', async () => {
      const mockConnection = createMockWebSocketConnection();
      jest
        .spyOn(mockWebSocketConnectionRepository, 'findByNetwork')
        .mockResolvedValueOnce(mockConnection);

      const connectionId = await service.getConnectionIdByNetwork(
        Network.Mainnet,
      );

      expect(connectionId).toBe(mockConnectionId);
    });
  });
});
