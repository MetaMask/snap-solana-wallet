/* eslint-disable @typescript-eslint/naming-convention */
import { Network } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import type { ILogger } from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import { TokenMetadataClient } from './TokenMetadataClient';

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

describe('TokenMetadataClient', () => {
  const mockFetch = jest.fn();
  const mockLogger = {
    error: jest.fn(),
  } as unknown as ILogger;

  let client: TokenMetadataClient;
  let mockConfigProvider: ConfigProvider;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        tokenApi: {
          baseUrl: 'https://some-mock-url.com',
          chunkSize: 50,
        },
      }),
    } as unknown as ConfigProvider;

    client = new TokenMetadataClient(mockConfigProvider, mockFetch, mockLogger);
  });

  it('fetches and parses token metadata', async () => {
    const tokenAddresses = [
      tokenAddressToCaip19(Network.Localnet, 'address1'),
      tokenAddressToCaip19(Network.Localnet, 'address2'),
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(MOCK_METADATA_RESPONSE),
    });
    const metadata = await client.getTokenMetadataFromAddresses(tokenAddresses);

    expect(metadata).toStrictEqual({
      [`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:1GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr`]:
        {
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/1GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr.png',
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
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr.png',
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
      tokenAddressToCaip19(Network.Localnet, `address${i}`),
    );

    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(MOCK_METADATA_RESPONSE),
    });

    await client.getTokenMetadataFromAddresses(tokenAddresses);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws an error if fetch fails', async () => {
    const tokenAddresses = [
      tokenAddressToCaip19(Network.Localnet, 'address1'),
      tokenAddressToCaip19(Network.Localnet, 'address2'),
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
});
