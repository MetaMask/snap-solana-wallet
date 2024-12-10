/* eslint-disable no-restricted-globals */
import { SolanaCaip2Networks } from '../../constants/solana';
import { SolanaConnection } from './SolanaConnection';

jest.mock('@solana/web3.js', () => ({
  createDefaultRpcTransport: jest.fn().mockImplementation(({ url }) => ({
    url,
  })),
  createSolanaRpcFromTransport: jest.fn().mockImplementation(({ url }) => ({
    url,
  })),
}));

jest.mock('./retryingTransport', () => ({
  createRetryingTransport: jest.fn().mockImplementation(({ url }) => ({
    url,
  })),
}));

jest.mock('../../constants/solana', () => ({
  SOLANA_NETWORK_TO_RPC_URLS: {
    'solana:mainnet': 'https://mainnet.com',
    'solana:devnet': 'https://devnet.com',
  },
  SolanaCaip2Networks: {
    Mainnet: 'solana:mainnet',
    Devnet: 'solana:devnet',
  },
}));

describe('SolanaConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRpc', () => {
    let connection: SolanaConnection;

    beforeEach(() => {
      connection = new SolanaConnection();
    });

    it('returns the correct RPC client for a valid network', () => {
      const rpc = connection.getRpc(SolanaCaip2Networks.Mainnet);
      expect(rpc).toBeDefined();
      expect(rpc).toStrictEqual({
        url: 'https://mainnet.com',
      });
    });

    it('returns the same RPC client for the same network', () => {
      const rpc1 = connection.getRpc(SolanaCaip2Networks.Mainnet);
      const rpc2 = connection.getRpc(SolanaCaip2Networks.Mainnet);
      expect(rpc1).toBe(rpc2);
    });

    it('returns different RPC clients for different networks', () => {
      const rpc1 = connection.getRpc(SolanaCaip2Networks.Mainnet);
      const rpc2 = connection.getRpc(SolanaCaip2Networks.Devnet);
      expect(rpc1).not.toBe(rpc2);
    });

    it('throws an error for an invalid network', () => {
      expect(() => {
        connection.getRpc('invalid-network' as SolanaCaip2Networks);
      }).toThrow('Invalid network: invalid-network');
    });
  });
});
