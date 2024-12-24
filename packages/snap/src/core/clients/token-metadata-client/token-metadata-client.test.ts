/* eslint-disable @typescript-eslint/naming-convention */
import { SolanaCaip2Networks } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import type { ILogger } from '../../utils/logger';
import { TokenMetadataClient } from './token-metadata-client';
import type { TokenMetadata, TokenMetadataResponse } from './types';

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
    const mockFetchResponse: Partial<TokenMetadata> = {
      fungible_id: 'solana.address1',
      symbol: 'MOCK',
      name: 'Mock Token',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockFetchResponse),
    });
    const scope = SolanaCaip2Networks.Localnet;
    const metadata = await client.getTokenMetadataFromAddresses(
      tokenAddresses,
      scope,
    );

    expect(metadata).toStrictEqual({
      'solana:123456789abcdef/token:address1': {
        iconUrl:
          'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/address1/logo.png',
        name: 'Mock Token',
        symbol: 'MOCK',
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
        },
      ],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockFetchResponse),
    });
    const scope = SolanaCaip2Networks.Localnet;
    const metadata = await client.getTokenMetadataFromAddresses(
      tokenAddresses,
      scope,
    );

    expect(metadata).toStrictEqual({
      'solana:123456789abcdef/token:address1': {
        iconUrl:
          'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/address1/logo.png',
        name: 'Mock Token',
        symbol: 'MOCK',
      },
    });
  });

  it('throws an error if fetch fails', async () => {
    const tokenAddresses = ['address1', 'address2'];
    const errorMessage = 'Error fetching token metadata';
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));
    const scope = SolanaCaip2Networks.Localnet;

    await expect(
      client.getTokenMetadataFromAddresses(tokenAddresses, scope),
    ).rejects.toThrow(errorMessage);
    expect(mockLogger.error).toHaveBeenCalledWith(
      new Error(errorMessage),
      errorMessage,
    );
  });
});
