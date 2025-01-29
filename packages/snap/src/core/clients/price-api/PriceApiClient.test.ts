import { Caip19Id } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import { mockLogger } from '../../services/mocks/logger';
import { PriceApiClient } from './PriceApiClient';
import type { SpotPriceResponse, SpotPrices } from './types';

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
    const mockResponse: SpotPrices = {
      [Caip19Id.SolLocalnet]: { usd: 100 },
      [Caip19Id.UsdcLocalnet]: { usd: 100 },
    };
    const expectedResponse: SpotPriceResponse = {
      [Caip19Id.SolLocalnet]: { price: 100 },
      [Caip19Id.UsdcLocalnet]: { price: 100 },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await client.getMultipleSpotPrices([
      Caip19Id.SolLocalnet,
      Caip19Id.UsdcLocalnet,
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
        Caip19Id.SolLocalnet,
        Caip19Id.UsdcLocalnet,
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
        Caip19Id.SolLocalnet,
        Caip19Id.UsdcLocalnet,
      ]),
    ).rejects.toThrow('HTTP error! status: 404');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Error fetching spot prices',
    );
  });

  it('fetches spot price with custom vsCurrency', async () => {
    const mockResponse: SpotPrices = {
      [Caip19Id.SolLocalnet]: { eur: 100 },
      [Caip19Id.UsdcLocalnet]: { eur: 100 },
    };
    const expectedResponse: SpotPriceResponse = {
      [Caip19Id.SolLocalnet]: { price: 100 },
      [Caip19Id.UsdcLocalnet]: { price: 100 },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await client.getMultipleSpotPrices(
      [Caip19Id.SolLocalnet, Caip19Id.UsdcLocalnet],
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
        Caip19Id.SolLocalnet,
        Caip19Id.UsdcLocalnet,
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
        Caip19Id.SolLocalnet,
        Caip19Id.UsdcLocalnet,
      ]),
    ).rejects.toThrow('Network timeout');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Error fetching spot prices',
    );
  });
});
