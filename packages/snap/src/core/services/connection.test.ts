import {
  SOLANA_NETWORK_TO_RPC_URLS,
  SolanaCaip2Networks,
} from '../constants/solana';
import { SolanaConnection } from './connection';

// Mock the createSolanaRpc function
jest.mock('@solana/web3.js', () => ({
  createSolanaRpc: jest.fn().mockImplementation((url) => ({ url })),
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

    it('should return the correct RPC client for a valid network', () => {
      const rpc = connection.getRpc(SolanaCaip2Networks.Mainnet);
      expect(rpc).toBeDefined();
      expect(rpc).toStrictEqual({
        url: SOLANA_NETWORK_TO_RPC_URLS[SolanaCaip2Networks.Mainnet],
      });
    });

    it('should return the same RPC client for the same network', () => {
      const rpc1 = connection.getRpc(SolanaCaip2Networks.Mainnet);
      const rpc2 = connection.getRpc(SolanaCaip2Networks.Mainnet);
      expect(rpc1).toBe(rpc2);
    });

    it('should return different RPC clients for different networks', () => {
      const rpc1 = connection.getRpc(SolanaCaip2Networks.Mainnet);
      const rpc2 = connection.getRpc(SolanaCaip2Networks.Devnet);
      expect(rpc1).not.toBe(rpc2);
    });

    it('should throw an error for an invalid network', () => {
      expect(() => {
        connection.getRpc('invalid-network' as SolanaCaip2Networks);
      }).toThrow('Invalid network: invalid-network');
    });
  });
});
