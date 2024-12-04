import type { ConfigProvider } from '../../services/config-provider';
import type { ILogger } from '../../utils/logger';
import { PriceApiClient } from './price-api-client';
import type { SpotPrice } from './types';

describe('PriceApiClient', () => {
  const mockFetch = jest.fn();
  const mockLogger = {
    error: jest.fn(),
  } as unknown as ILogger;

  const mockConfigProvider = {
    safeGet: jest.fn().mockReturnValue('https://api.example.com'),
  } as unknown as ConfigProvider;

  let client: PriceApiClient;

  beforeEach(() => {
    client = new PriceApiClient(mockConfigProvider, mockFetch, mockLogger);
  });

  it('should fetch spot price successfully', async () => {
    const mockResponse: SpotPrice = { price: 100 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await client.getSpotPrice('chainId', 'tokenAddress');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/v2/chains/chainId/spot-prices/tokenAddress?vsCurrency=usd',
    );
    expect(result).toBe(mockResponse);
  });

  it('should log and throw an error if fetch fails', async () => {
    const mockError = new Error('Fetch failed');
    mockFetch.mockRejectedValueOnce(mockError);

    await expect(
      client.getSpotPrice('chainId', 'tokenAddress'),
    ).rejects.toThrow('Fetch failed');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching spot prices:',
      mockError,
    );
  });

  it('should throw an error if response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(
      client.getSpotPrice('chainId', 'tokenAddress'),
    ).rejects.toThrow('HTTP error! status: 404');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching spot prices:',
      expect.any(Error),
    );
  });

  it('should fetch spot price with custom vsCurrency', async () => {
    const mockResponse: SpotPrice = { price: 1.5 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await client.getSpotPrice('chainId', 'tokenAddress', 'eur');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/v2/chains/chainId/spot-prices/tokenAddress?vsCurrency=eur',
    );
    expect(result).toBe(mockResponse);
  });

  it('should handle full SpotPrice response', async () => {
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

  it('should handle malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
    });

    await expect(
      client.getSpotPrice('chainId', 'tokenAddress'),
    ).rejects.toThrow('Invalid JSON');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching spot prices:',
      expect.any(Error),
    );
  });

  it('should handle network timeout', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

    await expect(
      client.getSpotPrice('chainId', 'tokenAddress'),
    ).rejects.toThrow('Network timeout');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching spot prices:',
      expect.any(Error),
    );
  });
});
