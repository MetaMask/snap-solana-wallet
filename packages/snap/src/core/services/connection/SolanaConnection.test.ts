import { Network } from '../../constants/solana';
import type { ConfigProvider } from '../config';
import { SolanaConnection } from './SolanaConnection';

jest.mock('@solana/web3.js', () => ({
  createSolanaRpcFromTransport: jest.fn().mockImplementation((transport) => ({
    urls: transport.urls,
  })),
  address: jest.fn().mockImplementation((address) => address),
}));

jest.mock('./transport', () => ({
  createMainTransport: jest.fn().mockImplementation((urls) => ({
    urls,
  })),
}));

const MOCK_NETWORKS = [
  {
    caip2Id: Network.Mainnet,
    rpcUrls: ['https://mainnet.com'],
  },
  {
    caip2Id: Network.Devnet,
    rpcUrls: ['https://devnet.com'],
  },
];

describe('SolanaConnection', () => {
  let connection: SolanaConnection;
  let mockConfigProvider: ConfigProvider;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        networks: MOCK_NETWORKS,
      }),
      getNetworkBy: jest.fn().mockImplementation((key, value) => {
        switch (key) {
          case 'caip2Id':
            return MOCK_NETWORKS.find((network) => network.caip2Id === value);
          default:
            throw new Error('Implement the case.');
        }
      }),
    } as unknown as ConfigProvider;

    connection = new SolanaConnection(mockConfigProvider);
  });

  describe('getRpc', () => {
    it('returns the correct RPC client for a valid network', () => {
      const rpc = connection.getRpc(Network.Mainnet);
      expect(rpc).toBeDefined();
      expect(rpc).toStrictEqual({
        urls: ['https://mainnet.com'],
      });

      const rpcDevnet = connection.getRpc(Network.Devnet);
      expect(rpcDevnet).toBeDefined();
      expect(rpcDevnet).toStrictEqual({
        urls: ['https://devnet.com'],
      });
    });

    it('returns the same RPC client for the same network', () => {
      const rpc1 = connection.getRpc(Network.Mainnet);
      const rpc2 = connection.getRpc(Network.Mainnet);
      expect(rpc1).toBe(rpc2);
    });

    it('returns different RPC clients for different networks', () => {
      const rpc1 = connection.getRpc(Network.Mainnet);
      const rpc2 = connection.getRpc(Network.Devnet);
      expect(rpc1).not.toBe(rpc2);
    });

    it('throws an error for an invalid network', () => {
      expect(() => {
        connection.getRpc('invalid-network' as Network);
      }).toThrow('Invalid network: invalid-network');
    });
  });
});
