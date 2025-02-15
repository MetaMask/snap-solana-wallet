import { Network } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import { mockLogger } from '../../services/mocks/logger';
import { SecurityAlertsApiClient } from './SecurityAlertsApiClient';

describe('SecurityAlertsApiClient', () => {
  const mockFetch = jest.fn();

  let client: SecurityAlertsApiClient;
  let mockConfigProvider: ConfigProvider;

  beforeEach(() => {
    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        securityAlertsApi: {
          baseUrl: 'https://security-alerts-api-mock-url.com',
        },
      }),
    } as unknown as ConfigProvider;

    client = new SecurityAlertsApiClient(
      mockConfigProvider,
      mockFetch,
      mockLogger,
    );

    mockFetch.mockClear();
  });

  describe('scanTransaction', () => {
    it('returns the scan result', async () => {
      const mockResponse = {
        result: 'some-result',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const scanResult = await client.scanTransactions({
        method: 'method',
        accountAddress: 'accountAddress',
        transactions: ['transaction'],
        scope: Network.Mainnet,
        options: ['simulation', 'validation'],
      });

      expect(scanResult).toStrictEqual(mockResponse);
    });

    it('throws an error if the fetch fails', async () => {
      const mockError = new Error('Fetch failed');
      mockFetch.mockRejectedValueOnce(mockError);

      await expect(
        client.scanTransactions({
          method: 'method',
          accountAddress: 'accountAddress',
          transactions: ['transaction'],
          scope: Network.Mainnet,
          options: ['simulation', 'validation'],
        }),
      ).rejects.toThrow(mockError);
    });

    it('throws an error if the response is not ok', async () => {
      const mockError = new Error('Fetch failed');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 404,
        json: jest.fn().mockRejectedValue(new Error('HTTP error! status: 404')),
      });

      await expect(
        client.scanTransactions({
          method: 'method',
          accountAddress: 'accountAddress',
          transactions: ['transaction'],
          scope: Network.Mainnet,
          options: ['simulation', 'validation'],
        }),
      ).rejects.toThrow('HTTP error! status: 404');
    });
  });
});
