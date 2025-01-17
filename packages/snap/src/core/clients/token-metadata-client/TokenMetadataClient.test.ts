/* eslint-disable @typescript-eslint/naming-convention */
import { Network } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import type { ILogger } from '../../utils/logger';
import { TokenMetadataClient } from './TokenMetadataClient';

describe('TokenMetadataClient', () => {
  const mockFetch = jest.fn();
  const mockLogger = {
    error: jest.fn(),
  } as unknown as ILogger;

  let client: TokenMetadataClient;
  let mockConfigProvider: ConfigProvider;

  beforeEach(() => {
    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        tokenApi: {
          baseUrl: 'https://some-mock-url.com',
          apiKey: 'some-api-key',
        },
      }),
    } as unknown as ConfigProvider;

    client = new TokenMetadataClient(mockConfigProvider, mockFetch, mockLogger);
  });

  it('fetches and parses token metadata when one is returned', async () => {
    const tokenAddresses = ['address1', 'address2'];
    const mockFetchResponse = {
      fungible_id: 'solana.address1',
      symbol: 'MOCK',
      name: 'Mock Token',
      decimals: 6,
      previews: {
        image_small_url:
          'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/address1/logo.png',
      },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockFetchResponse),
    });
    const metadata = await client.getTokenMetadataFromAddresses(tokenAddresses);

    expect(metadata).toStrictEqual({
      [`${Network.Mainnet}/token:address1`]: {
        iconUrl:
          'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/address1/logo.png',
        name: 'Mock Token',
        symbol: 'MOCK',
        decimals: 6,
      },
    });
  });

  it('fetches and parses token metadata when multiple are returned', async () => {
    const tokenAddresses = ['address1', 'address2'];
    const mockFetchResponse = {
      fungibles: [
        {
          fungible_id: 'solana.address1',
          symbol: 'MOCK',
          name: 'Mock Token',
          decimals: 6,
          previews: {
            image_small_url:
              'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/address1/logo.png',
          },
        },
      ],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockFetchResponse),
    });
    const metadata = await client.getTokenMetadataFromAddresses(tokenAddresses);

    expect(metadata).toStrictEqual({
      [`${Network.Mainnet}/token:address1`]: {
        iconUrl:
          'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/address1/logo.png',
        name: 'Mock Token',
        symbol: 'MOCK',
        decimals: 6,
      },
    });
  });

  it('throws an error if fetch fails', async () => {
    const tokenAddresses = ['address1', 'address2'];
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
});
