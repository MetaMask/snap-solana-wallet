import type { SecurityAlertsApiClient } from '../../clients/security-alerts-api/SecurityAlertsApiClient';
import type { SecurityAlertSimulationValidationResponse } from '../../clients/security-alerts-api/types';
import { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import { TransactionScanService } from './TransactionScan';

describe('TransactionScan', () => {
  describe('scanTransaction', () => {
    let transactionScanService: TransactionScanService;
    let mockSecurityAlertsApiClient: SecurityAlertsApiClient;
    let mockLogger: ILogger;
    let mockTokenMetadataService: TokenMetadataService;

    beforeEach(() => {
      mockTokenMetadataService = {
        generateImageComponent: jest.fn().mockResolvedValue(null),
      } as unknown as TokenMetadataService;

      mockSecurityAlertsApiClient = {
        scanTransactions: jest.fn().mockResolvedValue({}),
      } as unknown as SecurityAlertsApiClient;

      mockLogger = {
        error: jest.fn(),
      } as unknown as ILogger;

      transactionScanService = new TransactionScanService(
        mockSecurityAlertsApiClient,
        mockTokenMetadataService,
        mockLogger,
      );
    });

    it('scans a transaction', async () => {
      jest
        .spyOn(mockSecurityAlertsApiClient, 'scanTransactions')
        .mockResolvedValue({
          status: 'SUCCESS',
        } as SecurityAlertSimulationValidationResponse);

      const result = await transactionScanService.scanTransaction({
        method: 'method',
        accountAddress: 'accountAddress',
        transaction: 'transaction',
        scope: Network.Mainnet,
      });

      expect(result).toMatchObject({
        status: 'SUCCESS',
      });
    });

    it('returns null if the scan fails', async () => {
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
