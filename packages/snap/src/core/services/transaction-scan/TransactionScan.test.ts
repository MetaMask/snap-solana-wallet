import type { SecurityAlertsApiClient } from '../../clients/security-alerts-api/SecurityAlertsApiClient';
import { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import { TransactionScanService } from './TransactionScan';

describe('TransactionScan', () => {
  describe('scanTransaction', () => {
    let transactionScanService: TransactionScanService;
    let mockSecurityAlertsApiClient: SecurityAlertsApiClient;
    let mockLogger: ILogger;

    beforeEach(() => {
      mockSecurityAlertsApiClient = {
        scanTransactions: jest.fn().mockResolvedValue({}),
      } as unknown as SecurityAlertsApiClient;

      mockLogger = {
        error: jest.fn(),
      } as unknown as ILogger;

      transactionScanService = new TransactionScanService(
        mockSecurityAlertsApiClient,
        mockLogger,
      );
    });

    it('should scan a transaction', async () => {
      const result = await transactionScanService.scanTransaction({
        method: 'method',
        accountAddress: 'accountAddress',
        transaction: 'transaction',
        scope: Network.Mainnet,
      });

      expect(result).toStrictEqual({});
    });

    it('should return null if the scan fails', async () => {
      jest
        .spyOn(mockSecurityAlertsApiClient, 'scanTransactions')
        .mockRejectedValue(new Error('Scan failed'));

      const result = await transactionScanService.scanTransaction({
        method: 'method',
        accountAddress: 'accountAddress',
        transaction: 'transaction',
        scope: Network.Mainnet,
      });

      expect(result).toBeNull();
    });
  });
});
