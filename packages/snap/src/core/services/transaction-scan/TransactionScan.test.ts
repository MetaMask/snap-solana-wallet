import type { SecurityAlertsApiClient } from '../../clients/security-alerts-api/SecurityAlertsApiClient';
import type { SecurityAlertSimulationValidationResponse } from '../../clients/security-alerts-api/types';
import { Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import type { ILogger } from '../../utils/logger';
import type { AnalyticsService } from '../analytics/AnalyticsService';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import { TransactionScanService } from './TransactionScan';
import { ScanStatus, SecurityAlertResponse } from './types';

describe('TransactionScan', () => {
  describe('scanTransaction', () => {
    let transactionScanService: TransactionScanService;
    let mockSecurityAlertsApiClient: SecurityAlertsApiClient;
    let mockLogger: ILogger;
    let mockTokenMetadataService: TokenMetadataService;
    let mockAnalyticsService: AnalyticsService;

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

      mockAnalyticsService = {
        trackEventSecurityScanCompleted: jest.fn().mockResolvedValue(undefined),
        trackEventSecurityAlertDetected: jest.fn().mockResolvedValue(undefined),
      } as unknown as AnalyticsService;

      transactionScanService = new TransactionScanService(
        mockSecurityAlertsApiClient,
        mockTokenMetadataService,
        mockAnalyticsService,
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
        origin: 'https://metamask.io',
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
        origin: 'https://metamask.io',
      });

      expect(result).toBeNull();
    });

    it('tracks security scan completion when account is provided', async () => {
      const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;

      jest
        .spyOn(mockSecurityAlertsApiClient, 'scanTransactions')
        .mockResolvedValue({
          status: ScanStatus.SUCCESS,
          encoding: 'base58',
          error: null,
          error_details: null,
          request_id: 'test-request-id',
          result: {
            validation: {
              result_type: SecurityAlertResponse.Benign,
              reason: '',
              features: [],
            },
            simulation: {
              account_summary: {
                account_assets_diff: [],
                account_delegations: [],
                account_ownerships_diff: [],
                total_usd_diff: { in: 0, out: 0, total: 0 },
              },
            },
          },
        } as unknown as SecurityAlertSimulationValidationResponse);

      await transactionScanService.scanTransaction({
        method: 'method',
        accountAddress: 'accountAddress',
        transaction: 'transaction',
        scope: Network.Mainnet,
        origin: 'https://metamask.io',
        account: mockAccount,
      });

      // hasSecurityAlerts = false for Benign response
      expect(
        mockAnalyticsService.trackEventSecurityScanCompleted,
      ).toHaveBeenCalledWith(
        mockAccount,
        'transaction',
        'https://metamask.io',
        Network.Mainnet,
        ScanStatus.SUCCESS,
        false,
      );
    });

    it('tracks security alert when malicious transaction is detected', async () => {
      const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;

      jest
        .spyOn(mockSecurityAlertsApiClient, 'scanTransactions')
        .mockResolvedValue({
          status: ScanStatus.SUCCESS,
          encoding: 'base58',
          error: null,
          error_details: null,
          request_id: 'test-request-id',
          result: {
            validation: {
              result_type: SecurityAlertResponse.Warning,
              reason: 'transfer_farming',
              features: [],
            },
            simulation: {
              account_summary: {
                account_assets_diff: [],
                account_delegations: [],
                account_ownerships_diff: [],
                total_usd_diff: { in: 0, out: 0, total: 0 },
              },
            },
          },
        } as unknown as SecurityAlertSimulationValidationResponse);

      await transactionScanService.scanTransaction({
        method: 'method',
        accountAddress: 'accountAddress',
        transaction: 'transaction',
        scope: Network.Mainnet,
        origin: 'https://metamask.io',
        account: mockAccount,
      });

      // hasSecurityAlerts = true for Warning response
      expect(
        mockAnalyticsService.trackEventSecurityScanCompleted,
      ).toHaveBeenCalledWith(
        mockAccount,
        'transaction',
        'https://metamask.io',
        Network.Mainnet,
        ScanStatus.SUCCESS,
        true,
      );

      expect(
        mockAnalyticsService.trackEventSecurityAlertDetected,
      ).toHaveBeenCalledWith(
        mockAccount,
        'transaction',
        'https://metamask.io',
        Network.Mainnet,
        SecurityAlertResponse.Warning,
        'transfer_farming',
        "Substantial transfer of the account's assets to untrusted entities",
      );
    });

    it('tracks error when scan fails and account is provided', async () => {
      const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;

      jest
        .spyOn(mockSecurityAlertsApiClient, 'scanTransactions')
        .mockRejectedValue(new Error('Scan failed'));

      await transactionScanService.scanTransaction({
        method: 'method',
        accountAddress: 'accountAddress',
        transaction: 'transaction',
        scope: Network.Mainnet,
        origin: 'https://metamask.io',
        account: mockAccount,
      });

      expect(
        mockAnalyticsService.trackEventSecurityScanCompleted,
      ).toHaveBeenCalledWith(
        mockAccount,
        'transaction',
        'https://metamask.io',
        Network.Mainnet,
        ScanStatus.ERROR,
        false,
      );
    });
  });

  describe('getSecurityAlertDescription', () => {
    let transactionScanService: TransactionScanService;
    let mockSecurityAlertsApiClient: SecurityAlertsApiClient;
    let mockLogger: ILogger;
    let mockTokenMetadataService: TokenMetadataService;
    let mockAnalyticsService: AnalyticsService;

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

      mockAnalyticsService = {
        trackEventSecurityScanCompleted: jest.fn().mockResolvedValue(undefined),
        trackEventSecurityAlertDetected: jest.fn().mockResolvedValue(undefined),
      } as unknown as AnalyticsService;

      transactionScanService = new TransactionScanService(
        mockSecurityAlertsApiClient,
        mockTokenMetadataService,
        mockAnalyticsService,
        mockLogger,
      );
    });

    it('returns correct description for known reasons', () => {
      const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;

      jest
        .spyOn(mockSecurityAlertsApiClient, 'scanTransactions')
        .mockResolvedValue({
          status: ScanStatus.SUCCESS,
          encoding: 'base58',
          error: null,
          error_details: null,
          request_id: 'test-request-id',
          result: {
            validation: {
              result_type: SecurityAlertResponse.Warning,
              reason: 'transfer_farming',
              features: [],
            },
            simulation: {
              account_summary: {
                account_assets_diff: [],
                account_delegations: [],
                account_ownerships_diff: [],
                total_usd_diff: { in: 0, out: 0, total: 0 },
              },
            },
          },
        } as unknown as SecurityAlertSimulationValidationResponse);

      return transactionScanService
        .scanTransaction({
          method: 'method',
          accountAddress: 'accountAddress',
          transaction: 'transaction',
          scope: Network.Mainnet,
          origin: 'https://metamask.io',
          account: mockAccount,
        })
        .then(() => {
          expect(
            mockAnalyticsService.trackEventSecurityAlertDetected,
          ).toHaveBeenCalledWith(
            mockAccount,
            'transaction',
            'https://metamask.io',
            Network.Mainnet,
            SecurityAlertResponse.Warning,
            'transfer_farming',
            "Substantial transfer of the account's assets to untrusted entities",
          );
        });
    });

    it('returns fallback description for unknown reasons', () => {
      const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;

      jest
        .spyOn(mockSecurityAlertsApiClient, 'scanTransactions')
        .mockResolvedValue({
          status: ScanStatus.SUCCESS,
          encoding: 'base58',
          error: null,
          error_details: null,
          request_id: 'test-request-id',
          result: {
            validation: {
              result_type: SecurityAlertResponse.Warning,
              reason: 'unknown_reason',
              features: [],
            },
            simulation: {
              account_summary: {
                account_assets_diff: [],
                account_delegations: [],
                account_ownerships_diff: [],
                total_usd_diff: { in: 0, out: 0, total: 0 },
              },
            },
          },
        } as unknown as SecurityAlertSimulationValidationResponse);

      return transactionScanService
        .scanTransaction({
          method: 'method',
          accountAddress: 'accountAddress',
          transaction: 'transaction',
          scope: Network.Mainnet,
          origin: 'https://metamask.io',
          account: mockAccount,
        })
        .then(() => {
          expect(
            mockAnalyticsService.trackEventSecurityAlertDetected,
          ).toHaveBeenCalledWith(
            mockAccount,
            'transaction',
            'https://metamask.io',
            Network.Mainnet,
            SecurityAlertResponse.Warning,
            'unknown_reason',
            'Security alert: unknown_reason',
          );
        });
    });
  });
});
