import type { CaipAssetType } from '@metamask/keyring-api';

import { KnownCaip19Id } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import { mockLogger } from '../../services/mocks/logger';
import { PriceApiClient } from './PriceApiClient';
import type {
  SpotPrices,
  SpotPricesFromPriceApiWithoutMarketData,
  VsCurrencyParam,
} from './types';

describe('PriceApiClient', () => {
  const mockFetch = jest.fn();

  let client: PriceApiClient;
  let mockConfigProvider: ConfigProvider;

  beforeEach(() => {
    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        priceApi: {
          baseUrl: 'https://some-mock-url.com',
          chunkSize: 50,
        },
      }),
    } as unknown as ConfigProvider;

    client = new PriceApiClient(mockConfigProvider, mockFetch, mockLogger);

    mockFetch.mockClear();
  });

  it('fetches multiple spot prices successfully', async () => {
    const mockResponse: SpotPricesFromPriceApiWithoutMarketData = {
      [KnownCaip19Id.SolLocalnet]: { usd: 100 },
      [KnownCaip19Id.UsdcLocalnet]: { usd: 100 },
    };
    const expectedResponse: SpotPrices = {
      [KnownCaip19Id.SolLocalnet]: { price: 100 },
      [KnownCaip19Id.UsdcLocalnet]: { price: 100 },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await client.getMultipleSpotPrices([
      KnownCaip19Id.SolLocalnet,
      KnownCaip19Id.UsdcLocalnet,
    ]);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://some-mock-url.com/v3/spot-prices?vsCurrency=usd&assetIds=solana%3A123456789abcdef%2Fslip44%3A501%2Csolana%3A123456789abcdef%2Ftoken%3A4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU&includeMarketData=false',
    );
    expect(result).toStrictEqual(expectedResponse);
  });

  it('logs and throws an error if fetch fails', async () => {
    const mockError = new Error('Fetch failed');
    mockFetch.mockRejectedValueOnce(mockError);

    await expect(
      client.getMultipleSpotPrices([
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ]),
    ).rejects.toThrow('Fetch failed');
    expect(mockLogger.error).toHaveBeenCalledWith(
      mockError,
      'Error fetching spot prices',
    );
  });

  it('throws an error if response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(
      client.getMultipleSpotPrices([
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ]),
    ).rejects.toThrow('HTTP error! status: 404');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Error fetching spot prices',
    );
  });

  it('fetches spot price with custom vsCurrency', async () => {
    const mockResponse: SpotPricesFromPriceApiWithoutMarketData = {
      [KnownCaip19Id.SolLocalnet]: { eur: 100 },
      [KnownCaip19Id.UsdcLocalnet]: { eur: 100 },
    };
    const expectedResponse: SpotPrices = {
      [KnownCaip19Id.SolLocalnet]: { price: 100 },
      [KnownCaip19Id.UsdcLocalnet]: { price: 100 },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await client.getMultipleSpotPrices(
      [KnownCaip19Id.SolLocalnet, KnownCaip19Id.UsdcLocalnet],
      'eur',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://some-mock-url.com/v3/spot-prices?vsCurrency=eur&assetIds=solana%3A123456789abcdef%2Fslip44%3A501%2Csolana%3A123456789abcdef%2Ftoken%3A4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU&includeMarketData=false',
    );
    expect(result).toStrictEqual(expectedResponse);
  });

  it('handles malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
    });

    await expect(
      client.getMultipleSpotPrices([
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ]),
    ).rejects.toThrow('Invalid JSON');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Error fetching spot prices',
    );
  });

  it('handles network timeout', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

    await expect(
      client.getMultipleSpotPrices([
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ]),
    ).rejects.toThrow('Network timeout');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Error fetching spot prices',
    );
  });

  it('throws when malformed response from the Price API', async () => {
    const mockMalformedResponse = {
      [KnownCaip19Id.SolLocalnet]: { name: 'Bob' },
      [KnownCaip19Id.UsdcLocalnet]: { usd: 100 },
    } as unknown as SpotPricesFromPriceApiWithoutMarketData;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockMalformedResponse),
    });

    await expect(
      client.getMultipleSpotPrices([
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ]),
    ).rejects.toThrow(
      'At path: solana:123456789abcdef/slip44:501.name -- Expected a number, but received: "Bob"',
    );
  });

  describe('security', () => {
    it('rejects invalid base URLs in constructor', () => {
      const invalidConfigProvider = {
        get: jest.fn().mockReturnValue({
          priceApi: {
            // eslint-disable-next-line no-script-url
            baseUrl: 'javascript:alert(1)',
            chunkSize: 50,
          },
        }),
      } as unknown as ConfigProvider;

      expect(
        () => new PriceApiClient(invalidConfigProvider, mockFetch, mockLogger),
      ).toThrow(/Expected a string matching/u);
    });

    it('rejects tokenCaip19Ids that are invalid or that include malicious inputs', async () => {
      await expect(
        client.getMultipleSpotPrices([
          KnownCaip19Id.SolLocalnet,
          'INVALID<script>alert(1)</script>' as CaipAssetType,
        ]),
      ).rejects.toThrow(/Expected a string matching/u);
    });

    it('rejects vsCurrency parameters that are invalid or that include malicious inputs', async () => {
      await expect(
        client.getMultipleSpotPrices(
          [KnownCaip19Id.SolLocalnet],
          'INVALID<script>alert(1)</script>' as VsCurrencyParam,
        ),
      ).rejects.toThrow(/Expected one of/u);
    });

    it('handles URLs with multiple query parameters safely', async () => {
      const mockResponse: SpotPricesFromPriceApiWithoutMarketData = {
        [KnownCaip19Id.SolLocalnet]: { usd: 100 },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      await client.getMultipleSpotPrices([KnownCaip19Id.SolLocalnet]);

      // Verify URL is properly constructed with encoded parameters
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(
          /^https:\/\/some-mock-url\.com\/v3\/spot-prices\?([^&=]+=[^&]*&)*[^&=]+=.+$/u,
        ),
      );
    });

    it('rejects non-printable characters in input', async () => {
      const mockResponse: SpotPricesFromPriceApiWithoutMarketData = {
        [KnownCaip19Id.SolLocalnet]: { usd: 100 },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      await expect(
        client.getMultipleSpotPrices(
          [KnownCaip19Id.SolLocalnet],
          'usd\x00\x1F' as VsCurrencyParam, // Adding null and unit separator characters
        ),
      ).rejects.toThrow(/Expected one of/u);
    });
  });
});
