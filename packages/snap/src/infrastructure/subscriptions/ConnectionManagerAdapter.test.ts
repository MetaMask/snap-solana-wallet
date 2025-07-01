import { Network } from '../../core/constants/solana';
import type { ConfigProvider } from '../../core/services/config';
import type {
  Config,
  NetworkWithRpcUrls,
} from '../../core/services/config/ConfigProvider';
import { mockLogger } from '../../core/services/mocks/logger';
import { EventEmitter } from '../event-emitter/EventEmitter';
import { ConnectionManagerAdapter } from './ConnectionManagerAdapter';
import type { ConnectionRepository } from './ConnectionRepository';

const mockWebSocketUrl = 'wss://some-mock-url.com/ws/v3/some-id';
const mockConnectionId = 'mock-connection-id';

const createMockConnection = (
  id = mockConnectionId,
  url = mockWebSocketUrl,
) => ({
  id,
  url,
  protocols: [],
});

describe('ConnectionManagerAdapter', () => {
  let connectionManager: ConnectionManagerAdapter;
  let mockConnectionRepository: ConnectionRepository;
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
  ] as NetworkWithRpcUrls[];

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
        networks: mockNetworksConfig,
        subscription: {
          maxReconnectAttempts: 5,
          reconnectDelayMilliseconds: 1, // To speed up the tests
        },
      }),
      getNetworkBy: jest.fn().mockImplementation((key, value) => {
        return mockNetworksConfig.find(
          (item) => item[key as keyof NetworkWithRpcUrls] === value,
        );
      }),
    } as unknown as ConfigProvider;

    mockEventEmitter = new EventEmitter(mockLogger);

    connectionManager = new ConnectionManagerAdapter(
      mockConnectionRepository,
      mockConfigProvider,
      mockEventEmitter,
      mockLogger,
    );
  });

  describe('setupAllConnections', () => {
    it('opens the connections for the active networks that are not already open', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet, Network.Devnet],
      } as unknown as Config);

      // Init with an existing connection for Mainnet. We expect to only open the connection for Devnet.
      const mockConnectionMainnet = createMockConnection();

      jest
        .spyOn(mockConnectionRepository, 'getAll')
        .mockResolvedValueOnce([mockConnectionMainnet]);

      jest
        .spyOn(mockConnectionRepository, 'save')
        .mockResolvedValueOnce(mockConnectionId);

      await connectionManager.setupAllConnections();

      expect(mockConnectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockConnectionRepository.save).toHaveBeenCalledWith(
        'wss://some-mock-url2.com/ws/v3/some-id',
      );
    });

    it('does nothing for active networks that are already open', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);

      const mockConnection = createMockConnection();

      jest
        .spyOn(mockConnectionRepository, 'getAll')
        .mockResolvedValueOnce([mockConnection]);

      await connectionManager.setupAllConnections();

      expect(mockConnectionRepository.save).toHaveBeenCalledTimes(0);
    });

    it('closes the connections for the inactive networks that are open', async () => {
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [],
      } as unknown as Config);

      const openConnection = createMockConnection();

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

    describe('when the connection fails', () => {
      beforeEach(() => {
        jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
          activeNetworks: [Network.Mainnet],
        } as unknown as Config);

        jest
          .spyOn(mockConnectionRepository, 'getAll')
          .mockResolvedValueOnce([]);
      });

      it('retries until it succeeds, when attempts < 5', async () => {
        jest
          .spyOn(mockConnectionRepository, 'save')
          .mockRejectedValueOnce(new Error('Connection failed')) // 1st call is the fail attempt
          .mockResolvedValueOnce(mockConnectionId); // 2nd call is the success attempt

        await connectionManager.setupAllConnections();

        expect(mockConnectionRepository.save).toHaveBeenCalledTimes(2);
      });

      it('retries up to the max number of attempts', async () => {
        jest
          .spyOn(mockConnectionRepository, 'save')
          .mockRejectedValue(new Error('Connection failed'));

        await connectionManager.setupAllConnections();

        expect(mockConnectionRepository.save).toHaveBeenCalledTimes(5);
      });
    });
  });

  describe('#handleWebSocketEvent', () => {
    describe('when the event is a connect', () => {
      beforeEach(async () => {
        const mockConnection = createMockConnection();

        jest
          .spyOn(mockConnectionRepository, 'getById')
          .mockResolvedValue(mockConnection);

        jest
          .spyOn(mockConnectionRepository, 'findByUrl')
          .mockResolvedValueOnce(mockConnection);
      });

      it('triggers all the recovery callbacks', async () => {
        const recoveryCallback0 = jest.fn();
        const recoveryCallback1 = jest.fn();

        connectionManager.onConnectionRecovery(
          Network.Mainnet,
          recoveryCallback0,
        );
        connectionManager.onConnectionRecovery(
          Network.Mainnet,
          recoveryCallback1,
        );

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
        const mockConnection = createMockConnection();

        jest
          .spyOn(mockConnectionRepository, 'getAll')
          .mockResolvedValueOnce([mockConnection]);

        jest
          .spyOn(mockConnectionRepository, 'getById')
          .mockResolvedValueOnce(mockConnection);
      });

      it('attempts to reconnect', async () => {
        // Send the connect event
        await mockEventEmitter.emitSync('onWebSocketEvent', {
          id: mockConnectionId,
          type: 'close',
        });

        expect(mockConnectionRepository.save).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('getConnectionIdByNetwork', () => {
    it('returns the connection ID for the network', async () => {
      const mockConnection = createMockConnection();
      jest
        .spyOn(mockConnectionRepository, 'findByUrl')
        .mockResolvedValueOnce(mockConnection);

      const connectionId = await connectionManager.getConnectionIdByNetwork(
        Network.Mainnet,
      );

      expect(connectionId).toBe(mockConnectionId);
    });
  });
});
