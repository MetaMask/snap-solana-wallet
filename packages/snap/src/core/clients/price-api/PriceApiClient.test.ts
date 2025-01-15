import type { ConfigProvider } from '../../services/config';
import { mockLogger } from '../../services/mocks/logger';
import { PriceApiClient } from './PriceApiClient';
import type { SpotPrice } from './types';

describe('PriceApiClient', () => {
  const mockFetch = jest.fn();

  let client: PriceApiClient;
  let mockConfigProvider: ConfigProvider;

  beforeEach(() => {
    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        priceApi: {
          baseUrl: 'https://some-mock-url.com',
        },
      }),
    } as unknown as ConfigProvider;

    client = new PriceApiClient(mockConfigProvider, mockFetch, mockLogger);
  });

  it('fetches spot price successfully', async () => {
    const mockResponse: SpotPrice = { price: 100 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await client.getSpotPrice('chainId', 'tokenAddress');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://some-mock-url.com/v2/chains/chainId/spot-prices/tokenAddress?vsCurrency=usd',
    );
    expect(result).toBe(mockResponse);
  });

  it('logs and throws an error if fetch fails', async () => {
    const mockError = new Error('Fetch failed');
    mockFetch.mockRejectedValueOnce(mockError);

    await expect(
      client.getSpotPrice('chainId', 'tokenAddress'),
    ).rejects.toThrow('Fetch failed');
    expect(mockLogger.error).toHaveBeenCalledWith(
      mockError,
      'Error fetching spot prices:',
    );
  });

  it('throws an error if response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(
      client.getSpotPrice('chainId', 'tokenAddress'),
    ).rejects.toThrow('HTTP error! status: 404');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Error fetching spot prices:',
    );
  });

  it('fetches spot price with custom vsCurrency', async () => {
    const mockResponse: SpotPrice = { price: 1.5 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await client.getSpotPrice('chainId', 'tokenAddress', 'eur');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://some-mock-url.com/v2/chains/chainId/spot-prices/tokenAddress?vsCurrency=eur',
    );
    expect(result).toBe(mockResponse);
  });

  it('handles full SpotPrice response', async () => {
    const mockResponse: SpotPrice = {
      price: 100,
      priceChange1d: 5,
      pricePercentChange1d: 5,
      marketCap: 1000000,
      totalVolume: 500000,
      high1d: 105,
      low1d: 95,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await client.getSpotPrice('chainId', 'tokenAddress');

    expect(result).toBe(mockResponse);
    expect(result.priceChange1d).toBe(5);
    expect(result.marketCap).toBe(1000000);
  });

  it('handles malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
    });

    await expect(
      client.getSpotPrice('chainId', 'tokenAddress'),
    ).rejects.toThrow('Invalid JSON');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Error fetching spot prices:',
    );
  });

  it('handles network timeout', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

    await expect(
      client.getSpotPrice('chainId', 'tokenAddress'),
    ).rejects.toThrow('Network timeout');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Error fetching spot prices:',
    );
  });
});
