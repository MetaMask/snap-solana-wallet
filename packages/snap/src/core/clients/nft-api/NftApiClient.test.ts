/* eslint-disable @typescript-eslint/naming-convention */
import type { ICache } from '../../caching/ICache';
import { InMemoryCache } from '../../caching/InMemoryCache';
import type { Serializable } from '../../serialization/types';
import type { ConfigProvider } from '../../services/config';
import { mockLogger } from '../../services/mocks/logger';
import { MOCK_NFT_METADATA_RESPONSE_MAPPED } from './mocks/mockNftMetadataResponseMapped';
import { MOCK_NFT_METADATA_RESPONSE_RAW } from './mocks/mockNftMetadataResponseRaw';
import { MOCK_NFTS_LIST_RESPONSE_MAPPED } from './mocks/mockNftsListResponseMapped';
import { MOCK_NFTS_LIST_RESPONSE_RAW } from './mocks/mockNftsListResponseRaw';
import { NftApiClient } from './NftApiClient';

const mockFetch = jest.fn();
let mockCache: ICache<Serializable>;

describe('NftApiClient', () => {
  let client: NftApiClient;
  let mockConfigProvider: ConfigProvider;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCache = new InMemoryCache(mockLogger);

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        nftApi: {
          baseUrl: 'https://some-mock-url.com',
          cacheTtlsMilliseconds: {
            listAddressSolanaNfts: 0,
            getNftMetadata: 0,
          },
        },
      }),
    } as unknown as ConfigProvider;

    client = new NftApiClient(
      mockConfigProvider,
      mockCache,
      mockFetch,
      mockLogger,
    );
  });

  describe('constructor', () => {
    it('rejects invalid baseUrl', async () => {
      const invalidConfigProvider = {
        get: jest.fn().mockReturnValue({
          nftApi: {
            baseUrl: 'invalid-url',
            cacheTtlsMilliseconds: {
              listAddressSolanaNfts: 0,
              getNftMetadata: 0,
            },
          },
        }),
      } as unknown as ConfigProvider;

      expect(
        () =>
          new NftApiClient(
            invalidConfigProvider,
            mockCache,
            mockFetch,
            mockLogger,
          ),
      ).toThrow('Invalid URL format');
    });
  });

  describe('listAddressSolanaNfts', () => {
    it('should correctly map the API response, covering the logic from mapListAddressSolanaNftsResponse.test.ts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          ...MOCK_NFTS_LIST_RESPONSE_RAW,
          cursor: null,
        }),
      });

      const nfts = await client.listAddressSolanaNfts('some-address');
      expect(nfts).toStrictEqual(MOCK_NFTS_LIST_RESPONSE_MAPPED.items);
    });

    it('should handle pagination', async () => {
      const MOCK_NFTS_LIST_RESPONSE_RAW_PAGE_1 = {
        ...MOCK_NFTS_LIST_RESPONSE_RAW,
        cursor: 'some-cursor',
      };
      const MOCK_NFTS_LIST_RESPONSE_RAW_PAGE_2 = {
        ...MOCK_NFTS_LIST_RESPONSE_RAW,
        cursor: null,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValueOnce(MOCK_NFTS_LIST_RESPONSE_RAW_PAGE_1),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValueOnce(MOCK_NFTS_LIST_RESPONSE_RAW_PAGE_2),
      });
      const nfts = await client.listAddressSolanaNfts('some-address');
      expect(nfts).toStrictEqual([
        ...MOCK_NFTS_LIST_RESPONSE_MAPPED.items,
        ...MOCK_NFTS_LIST_RESPONSE_MAPPED.items,
      ]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getNftMetadata', () => {
    it('should fetch and parse solana nft metadata for a given token address', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(MOCK_NFT_METADATA_RESPONSE_RAW),
      });
      const nft = await client.getNftMetadata('some-token-address');
      expect(nft).toStrictEqual(MOCK_NFT_METADATA_RESPONSE_MAPPED);
    });

    it('should return null if the fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('some-error'));
      const nft = await client.getNftMetadata('some-token-address');
      expect(nft).toBeNull();
    });
  });

  describe('getNftsMetadata', () => {
    it('should fetch and parse solana nft metadata for a given array of token addresses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(MOCK_NFT_METADATA_RESPONSE_RAW),
      });
      const nfts = await client.getNftsMetadata([
        'some-token-address-1',
        'some-token-address-2',
      ]);
      expect(nfts).toStrictEqual([
        MOCK_NFT_METADATA_RESPONSE_MAPPED,
        MOCK_NFT_METADATA_RESPONSE_MAPPED,
      ]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
