/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/naming-convention */

import { fetchJsonParsedAccount } from '@solana/kit';

import type { ICache } from '../../caching/ICache';
import { InMemoryCache } from '../../caching/InMemoryCache';
import { KnownCaip19Id, Network } from '../../constants/solana';
import type { Serializable } from '../../serialization/types';
import type { ConfigProvider } from '../config';
import { mockLogger } from '../mocks/logger';
import {
  MOCK_JSON_PARSED_ACCOUNT,
  MOCK_MINT_ACCOUNT,
} from '../mocks/mockSolanaRpcResponses';
import { SolanaConnection } from './SolanaConnection';

jest.mock('@solana/kit', () => ({
  ...jest.requireActual('@solana/kit'),
  createSolanaRpcFromTransport: jest.fn().mockImplementation((transport) => ({
    urls: transport.urls,
  })),
  address: jest.fn().mockImplementation((address) => address),
  fetchJsonParsedAccount: jest.fn(),
}));

jest.mock('@solana-program/token-2022', () => ({
  fetchMint: jest.fn().mockResolvedValue(MOCK_MINT_ACCOUNT),
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
  let mockCache: ICache<Serializable>;

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

    mockCache = new InMemoryCache(mockLogger);

    connection = new SolanaConnection(mockConfigProvider, mockCache);
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
      }).toThrow(/Expected one of/u);
    });
  });

  describe('fetchJsonParsedAccount', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      (fetchJsonParsedAccount as jest.Mock).mockResolvedValue(
        MOCK_JSON_PARSED_ACCOUNT,
      );
    });

    it('returns the JSON-parsed account', async () => {
      const jsonParsedAccount = await connection.fetchJsonParsedAccount(
        KnownCaip19Id.UsdcMainnet,
        Network.Mainnet,
      );

      expect(jsonParsedAccount).toStrictEqual(MOCK_JSON_PARSED_ACCOUNT);
    });

    it('caches the JSON-parsed account', async () => {
      const spy = jest.spyOn(require('@solana/kit'), 'fetchJsonParsedAccount');

      const call = async () =>
        connection.fetchJsonParsedAccount(
          KnownCaip19Id.UsdcMainnet,
          Network.Mainnet,
        );

      // Do the call twice in a row to test the cache
      await call();
      await call();

      // It should effectively call the RPC only once
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('bypasses the cache when skipCache is true', async () => {
      const spy = jest.spyOn(require('@solana/kit'), 'fetchJsonParsedAccount');

      const call = async () =>
        connection.fetchJsonParsedAccount(
          KnownCaip19Id.UsdcMainnet,
          Network.Mainnet,
          undefined,
          { skipCache: true },
        );

      await call();
      await call();

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchMint', () => {
    it('returns the mint account', async () => {
      const mint = await connection.fetchMint(
        KnownCaip19Id.UsdcMainnet,
        Network.Mainnet,
      );

      expect(mint).toStrictEqual(MOCK_MINT_ACCOUNT);
    });

    it('caches the mint account', async () => {
      const spy = jest.spyOn(
        require('@solana-program/token-2022'),
        'fetchMint',
      );

      const call = async () =>
        connection.fetchMint(KnownCaip19Id.UsdcMainnet, Network.Mainnet);

      await call();
      await call();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
