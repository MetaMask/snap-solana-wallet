/* eslint-disable @typescript-eslint/naming-convention */

import type { TokenCaipAssetType } from '../../constants/solana';
import { KnownCaip19Id, Network } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import { mockLogger } from '../../services/mocks/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import { TokenApiClient } from './TokenApiClient';

const MOCK_METADATA_RESPONSE = [
  {
    decimals: 9,
    assetId:
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:1GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    name: 'Popcat 1',
    symbol: 'POPCAT',
  },
  {
    decimals: 9,
    assetId:
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    name: 'Popcat 2',
    symbol: 'POPCAT',
  },
];

describe('TokenApiClient', () => {
  const mockFetch = jest.fn();

  let client: TokenApiClient;
  let mockConfigProvider: ConfigProvider;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        tokenApi: {
          baseUrl: 'https://some-mock-url.com',
          chunkSize: 50,
        },
        staticApi: {
          baseUrl: 'https://some-mock-static-url.com',
        },
      }),
    } as unknown as ConfigProvider;

    client = new TokenApiClient(mockConfigProvider, mockFetch, mockLogger);
  });

  describe('constructor', () => {
    it('rejects invalid baseUrl', async () => {
      const invalidConfigProvider = {
        get: jest.fn().mockReturnValue({
          tokenApi: {
            baseUrl: 'invalid-url',
          },
        }),
      } as unknown as ConfigProvider;

      expect(
        () => new TokenApiClient(invalidConfigProvider, mockFetch, mockLogger),
      ).toThrow('Invalid URL format');
    });
  });

  describe('getTokenMetadataFromAddresses', () => {
    it('fetches and parses token metadata', async () => {
      const tokenAddresses = [
        tokenAddressToCaip19(Network.Devnet, 'address1'),
        tokenAddressToCaip19(Network.Devnet, 'address2'),
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(MOCK_METADATA_RESPONSE),
      });

      const metadata =
        await client.getTokenMetadataFromAddresses(tokenAddresses);

      expect(metadata).toStrictEqual({
        [`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:1GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr`]:
          {
            iconUrl:
              'https://some-mock-static-url.com/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/1GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr.png',
            name: 'Popcat 1',
            symbol: 'POPCAT',
            fungible: true,
            units: [
              {
                decimals: 9,
                name: 'Popcat 1',
                symbol: 'POPCAT',
              },
            ],
          },
        [`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr`]:
          {
            iconUrl:
              'https://some-mock-static-url.com/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr.png',
            name: 'Popcat 2',
            symbol: 'POPCAT',
            fungible: true,
            units: [
              {
                decimals: 9,
                name: 'Popcat 2',
                symbol: 'POPCAT',
              },
            ],
          },
      });
    });

    it('handles addresses in chunks when more than the limit is provided', async () => {
      const tokenAddresses = Array.from({ length: 60 }, (_, i) =>
        tokenAddressToCaip19(Network.Devnet, `address${i}`),
      );

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(MOCK_METADATA_RESPONSE),
      });

      await client.getTokenMetadataFromAddresses(tokenAddresses);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('rejects caip19Ids that are invalid', async () => {
      await expect(
        client.getTokenMetadataFromAddresses([
          'invalid-caip19-id' as TokenCaipAssetType,
        ]),
      ).rejects.toThrow(
        'At path: 0 -- Expected a value of type `CaipAssetType`, but received: `"invalid-caip19-id"`',
      );
    });

    it('rejects caip19Ids that include malicious inputs', async () => {
      await expect(
        client.getTokenMetadataFromAddresses([
          KnownCaip19Id.EurcLocalnet,
          'INVALID<script>alert(1)</script>' as TokenCaipAssetType,
        ]),
      ).rejects.toThrow(
        'At path: 1 -- Expected a value of type `CaipAssetType`, but received: `"INVALID<script>alert(1)</script>"`',
      );
    });

    it('throws an error if fetch fails', async () => {
      const tokenAddresses = [
        tokenAddressToCaip19(Network.Devnet, 'address1'),
        tokenAddressToCaip19(Network.Devnet, 'address2'),
      ];

      const errorMessage = 'Error fetching token metadata';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        client.getTokenMetadataFromAddresses(tokenAddresses),
      ).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalledWith(
        new Error(errorMessage),
        errorMessage,
      );
    });

    it('throws an error if the response includes an invalid assetId', async () => {
      const tokenAddresses = [
        tokenAddressToCaip19(Network.Devnet, 'address1'),
        tokenAddressToCaip19(Network.Devnet, 'address2'),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            decimals: 9,
            assetId: 'bad-asset-id',
            name: 'Popcat 1',
            symbol: 'POPCAT',
          },
        ]),
      });

      await expect(
        client.getTokenMetadataFromAddresses(tokenAddresses),
      ).rejects.toThrow(
        'Expected a string matching `/^solana:[a-zA-Z0-9]+\\/token:[a-zA-Z0-9]+$/` but received "bad-asset-id"',
      );
    });

    it('ignores asset types that are not supported by the Token API', async () => {
      const supportedAssetType = tokenAddressToCaip19(
        Network.Mainnet,
        '1GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
      );
      const unsupportedAssetType = tokenAddressToCaip19(
        Network.Localnet,
        'address1',
      );
      const tokenAddresses = [supportedAssetType, unsupportedAssetType];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([MOCK_METADATA_RESPONSE[0]]),
      });

      const metadata =
        await client.getTokenMetadataFromAddresses(tokenAddresses);

      expect(metadata[supportedAssetType]).toBeDefined();
      expect(metadata[unsupportedAssetType]).toBeUndefined();
    });
  });
});
