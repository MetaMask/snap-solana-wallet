/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { CaipAssetType } from '@metamask/keyring-api';
import { cloneDeep } from 'lodash';

import type { ICache } from '../../caching/ICache';
import { InMemoryCache } from '../../caching/InMemoryCache';
import { KnownCaip19Id } from '../../constants/solana';
import type { Serializable } from '../../serialization/types';
import type { ConfigProvider } from '../../services/config';
import { mockLogger } from '../../services/mocks/logger';
import { MOCK_EXCHANGE_RATES } from '../../test/mocks/price-api/exchange-rates';
import { MOCK_HISTORICAL_PRICES } from './mocks/historical-prices';
import { MOCK_SPOT_PRICES } from './mocks/spot-prices';
import { PriceApiClient } from './PriceApiClient';
import type { SpotPrices, VsCurrencyParam } from './types';

describe('PriceApiClient', () => {
  let mockFetch: jest.Mock;
  let mockCache: ICache<Serializable>;
  let client: PriceApiClient;

  beforeEach(() => {
    mockFetch = jest.fn();

    const mockConfigProvider: ConfigProvider = {
      get: jest.fn().mockReturnValue({
        priceApi: {
          baseUrl: 'https://some-mock-url.com',
          chunkSize: 50,
          cacheTtlsMilliseconds: {
            fiatExchangeRates: 0,
            spotPrices: 0,
            historicalPrices: 0,
          },
        },
      }),
    } as unknown as ConfigProvider;

    mockCache = new InMemoryCache(mockLogger);

    client = new PriceApiClient(
      mockConfigProvider,
      mockCache,
      mockFetch,
      mockLogger,
    );
  });

  describe('getFiatExchangeRates', () => {
    it('fetches fiat exchange rates successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(MOCK_EXCHANGE_RATES),
      });

      const result = await client.getFiatExchangeRates();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://some-mock-url.com/v1/exchange-rates/fiat',
      );
      expect(result).toStrictEqual(MOCK_EXCHANGE_RATES);
    });
  });

  describe('getMultipleSpotPrices', () => {
    const mockResponse: SpotPrices = {
      [KnownCaip19Id.SolMainnet]: MOCK_SPOT_PRICES[KnownCaip19Id.SolMainnet]!,
      [KnownCaip19Id.UsdcMainnet]: MOCK_SPOT_PRICES[KnownCaip19Id.UsdcMainnet]!,
    };

    describe('when the data is not cached', () => {
      it('fetches multiple spot prices successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        });

        const result = await client.getMultipleSpotPrices([
          KnownCaip19Id.SolMainnet,
          KnownCaip19Id.UsdcMainnet,
        ]);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://some-mock-url.com/v3/spot-prices?vsCurrency=usd&assetIds=solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Fslip44%3A501%2Csolana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Ftoken%3AEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&includeMarketData=true',
        );
        expect(result).toStrictEqual(mockResponse);
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
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(MOCK_SPOT_PRICES),
        });

        await client.getMultipleSpotPrices(
          [KnownCaip19Id.SolMainnet, KnownCaip19Id.UsdcMainnet],
          'eur',
        );

        expect(mockFetch).toHaveBeenCalledWith(
          'https://some-mock-url.com/v3/spot-prices?vsCurrency=eur&assetIds=solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Fslip44%3A501%2Csolana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Ftoken%3AEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&includeMarketData=true',
        );
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
        const mockMalformedResponse = cloneDeep(mockResponse);
        mockMalformedResponse[KnownCaip19Id.SolMainnet]!.price = -999; // Price must be a positive number

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockMalformedResponse),
        });

        await expect(
          client.getMultipleSpotPrices([KnownCaip19Id.SolMainnet]),
        ).rejects.toThrow(
          'At path: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501.price -- Expected a number greater than or equal to 0 but received `-999`',
        );
      });
    });

    describe('when the data is fully cached', () => {
      it('returns the cached data', async () => {
        const cachedData = {
          'PriceApiClient:getMultipleSpotPrices:solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501:usd':
            MOCK_SPOT_PRICES[KnownCaip19Id.SolMainnet]!,
          'PriceApiClient:getMultipleSpotPrices:solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v:usd':
            MOCK_SPOT_PRICES[KnownCaip19Id.UsdcMainnet]!,
        };
        jest.spyOn(mockCache, 'mget').mockResolvedValueOnce(cachedData);
        jest.spyOn(mockCache, 'mset').mockResolvedValueOnce(undefined);

        const result = await client.getMultipleSpotPrices([
          KnownCaip19Id.SolMainnet,
          KnownCaip19Id.UsdcMainnet,
        ]);

        expect(result).toStrictEqual(mockResponse);
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockCache.mset).not.toHaveBeenCalled();
      });
    });

    describe('when the data is partially cached', () => {
      it('returns the cached data', async () => {
        // Only the first token is cached, we will need to fetch the second one
        const cachedData = {
          'PriceApiClient:getMultipleSpotPrices:solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501:usd':
            MOCK_SPOT_PRICES[KnownCaip19Id.SolMainnet]!,
        };
        jest.spyOn(mockCache, 'mget').mockResolvedValueOnce(cachedData);
        jest.spyOn(mockCache, 'mset').mockResolvedValueOnce(undefined);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            [KnownCaip19Id.UsdcMainnet]:
              MOCK_SPOT_PRICES[KnownCaip19Id.UsdcMainnet]!,
          }),
        });

        const result = await client.getMultipleSpotPrices([
          KnownCaip19Id.SolMainnet,
          KnownCaip19Id.UsdcMainnet,
        ]);

        expect(result).toStrictEqual(mockResponse);

        // We should have fetched the second token only
        expect(mockFetch).toHaveBeenCalledWith(
          'https://some-mock-url.com/v3/spot-prices?vsCurrency=usd&assetIds=solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Ftoken%3AEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&includeMarketData=true',
        );

        // The second token should be added to the cache
        expect(mockCache.mset).toHaveBeenCalledWith([
          {
            key: 'PriceApiClient:getMultipleSpotPrices:solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v:usd',
            value: MOCK_SPOT_PRICES[KnownCaip19Id.UsdcMainnet]!,
            ttlMilliseconds: 0,
          },
        ]);
      });
    });
  });

  describe('security', () => {
    it('rejects invalid base URLs in constructor', () => {
      const invalidConfigProvider = {
        get: jest.fn().mockReturnValue({
          priceApi: {
            baseUrl: 'invalid-url',
            chunkSize: 50,
            cacheTtlsMilliseconds: {
              fiatExchangeRates: 0,
              spotPrices: 0,
              historicalPrices: 0,
            },
          },
        }),
      } as unknown as ConfigProvider;

      expect(
        () =>
          new PriceApiClient(
            invalidConfigProvider,
            mockCache,
            mockFetch,
            mockLogger,
          ),
      ).toThrow('Invalid URL format');
    });

    it('rejects tokenCaipAssetTypes that are invalid or that include malicious inputs', async () => {
      await expect(
        client.getMultipleSpotPrices([
          KnownCaip19Id.SolLocalnet,
          'INVALID<script>alert(1)</script>' as CaipAssetType,
        ]),
      ).rejects.toThrow(
        'At path: 1 -- Expected a value of type `CaipAssetType`, but received: `"INVALID<script>alert(1)</script>"`',
      );
    });

    it('rejects vsCurrency parameters that are invalid or that include malicious inputs', async () => {
      await expect(
        client.getMultipleSpotPrices(
          [KnownCaip19Id.SolLocalnet],
          'INVALID<script>alert(1)</script>' as VsCurrencyParam,
        ),
      ).rejects.toThrow(/Expected/u);
    });

    it('handles URLs with multiple query parameters safely', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({}),
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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(
        client.getMultipleSpotPrices(
          [KnownCaip19Id.SolLocalnet],
          'usd\x00\x1F' as VsCurrencyParam,
        ),
      ).rejects.toThrow(/Expected/u);
    });
  });

  describe('getHistoricalPrices', () => {
    describe('when the data is not cached', () => {
      it('fetches historical prices successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(MOCK_HISTORICAL_PRICES),
        });

        const cacheSetSpy = jest.spyOn(mockCache, 'set');

        const result = await client.getHistoricalPrices({
          assetType: KnownCaip19Id.SolMainnet,
          timePeriod: '5d',
          from: 123,
          to: 456,
          vsCurrency: 'usd',
        });

        expect(mockFetch).toHaveBeenCalledWith(
          'https://some-mock-url.com/v3/historical-prices/solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501?timePeriod=5d&from=123&to=456&vsCurrency=usd',
        );
        expect(cacheSetSpy).toHaveBeenCalledWith(
          'PriceApiClient:getHistoricalPrices:{"assetType":"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501","timePeriod":"5d","from":123,"to":456,"vsCurrency":"usd"}',
          MOCK_HISTORICAL_PRICES,
          0,
        );
        expect(result).toStrictEqual(MOCK_HISTORICAL_PRICES);
      });
    });

    describe('when the data is cached', () => {
      it('returns the cached data', async () => {
        jest
          .spyOn(mockCache, 'get')
          .mockResolvedValueOnce(MOCK_HISTORICAL_PRICES);

        const cacheGetSpy = jest.spyOn(mockCache, 'get');
        const cacheSetSpy = jest.spyOn(mockCache, 'set');

        const result = await client.getHistoricalPrices({
          assetType: KnownCaip19Id.SolMainnet,
          timePeriod: '5d',
          from: 123,
          to: 456,
          vsCurrency: 'usd',
        });

        expect(cacheGetSpy).toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
        expect(result).toStrictEqual(MOCK_HISTORICAL_PRICES);
        expect(cacheSetSpy).not.toHaveBeenCalled();
      });
    });
  });
});
