/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Signature } from '@solana/kit';
import { address } from '@solana/kit';

import * as snapContext from '../../../../snapContext';
import { Network } from '../../../constants/solana';
import type { AssetsService } from '../../../services/assets/AssetsService';
import type { IStateManager } from '../../../services/state/IStateManager';
import type { UnencryptedStateValue } from '../../../services/state/State';
import type { TransactionsService } from '../../../services/transactions/TransactionsService';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../../test/mocks/solana-keyring-accounts';
import type { ILogger } from '../../../utils/logger';
import logger from '../../../utils/logger';
import type { SolanaKeyring } from '../../onKeyringRequest/Keyring';
import { onAccountsRefresh } from './onAccountsRefresh';

// Mock all dependencies
jest.mock('../../../../snapContext', () => ({
  keyring: {
    listAccounts: jest.fn(),
  },
  state: {
    getKey: jest.fn(),
  },
  assetsService: {
    refreshAssets: jest.fn(),
  },
  transactionsService: {
    fetchLatestSignatures: jest.fn(),
    refreshTransactions: jest.fn(),
  },
}));

describe('onAccountsRefresh', () => {
  const mockKeyring = snapContext.keyring as jest.Mocked<SolanaKeyring>;
  const mockState = snapContext.state as unknown as jest.Mocked<
    IStateManager<UnencryptedStateValue>
  >;
  const mockAssetsService =
    snapContext.assetsService as jest.Mocked<AssetsService>;
  const mockTransactionsService =
    snapContext.transactionsService as jest.Mocked<TransactionsService>;
  const mockLogger = logger as jest.Mocked<ILogger>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when accounts have changes', () => {
    it('refreshes assets and transactions for accounts with new signatures', async () => {
      // Setup two accounts. One had changes since last refresh, the other didn't.
      const accounts = [
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
        MOCK_SOLANA_KEYRING_ACCOUNT_1,
      ];
      mockKeyring.listAccounts.mockResolvedValue(accounts);

      const existingSignatures: Signature[] = ['signature1'] as Signature[];
      const newSignature = 'newSignature123' as Signature;

      // Mock state.getKey to return existing signatures for both accounts
      mockState.getKey.mockImplementation(async (key: string) => {
        if (key.includes(accounts[0]!.address)) {
          return Promise.resolve(existingSignatures);
        }
        if (key.includes(accounts[1]!.address)) {
          return Promise.resolve(['oldSignature'] as Signature[]);
        }
        return Promise.resolve([]);
      });

      // Mock fetchLatestSignatures - account 0 has new signature, account 1 doesn't
      mockTransactionsService.fetchLatestSignatures.mockImplementation(
        async (scope, addr) => {
          if (addr === address(accounts[0]!.address)) {
            return Promise.resolve([newSignature]); // New signature not in existing list
          }
          return Promise.resolve(['oldSignature'] as Signature[]); // Existing signature
        },
      );

      mockAssetsService.refreshAssets.mockResolvedValue();
      mockTransactionsService.refreshTransactions.mockResolvedValue();

      const request = {
        id: '1',
        jsonrpc: '2.0' as const,
        method: 'onCronjob',
        params: {},
      };

      await onAccountsRefresh({ request });

      expect(mockKeyring.listAccounts).toHaveBeenCalledTimes(1);
      expect(mockState.getKey).toHaveBeenCalledTimes(2);
      expect(mockState.getKey).toHaveBeenCalledWith(
        `signatures.${accounts[0]!.address}`,
      );
      expect(mockState.getKey).toHaveBeenCalledWith(
        `signatures.${accounts[1]!.address}`,
      );

      expect(
        mockTransactionsService.fetchLatestSignatures,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockTransactionsService.fetchLatestSignatures,
      ).toHaveBeenCalledWith(Network.Mainnet, address(accounts[0]!.address), 1);
      expect(
        mockTransactionsService.fetchLatestSignatures,
      ).toHaveBeenCalledWith(Network.Mainnet, address(accounts[1]!.address), 1);

      // Only account 0 should be refreshed (has changes)
      expect(mockAssetsService.refreshAssets).toHaveBeenCalledTimes(1);
      expect(mockAssetsService.refreshAssets).toHaveBeenCalledWith([
        accounts[0],
      ]);

      expect(mockTransactionsService.refreshTransactions).toHaveBeenCalledTimes(
        1,
      );
      expect(mockTransactionsService.refreshTransactions).toHaveBeenCalledWith([
        accounts[0],
      ]);

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[onAccountsRefresh] Cronjob triggered',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[onAccountsRefresh] Found 1 accounts with changes',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[onAccountsRefresh] Successfully refreshed 1 accounts',
      );
    });

    it('handles accounts with no existing signatures', async () => {
      const accounts = [MOCK_SOLANA_KEYRING_ACCOUNT_0];
      mockKeyring.listAccounts.mockResolvedValue(accounts);

      mockState.getKey.mockResolvedValue(null); // No existing signatures
      const newSignature = 'firstSignature' as Signature;

      mockTransactionsService.fetchLatestSignatures.mockResolvedValue([
        newSignature,
      ]);

      mockAssetsService.refreshAssets.mockResolvedValue();
      mockTransactionsService.refreshTransactions.mockResolvedValue();

      await onAccountsRefresh({
        request: {
          id: '1',
          jsonrpc: '2.0',
          method: 'onCronjob',
          params: {},
        },
      });

      expect(mockAssetsService.refreshAssets).toHaveBeenCalledWith([
        accounts[0],
      ]);
      expect(mockTransactionsService.refreshTransactions).toHaveBeenCalledWith([
        accounts[0],
      ]);
    });
  });

  //   describe('when no accounts have changes', () => {
  //     it('should skip refresh when all accounts have no new signatures', async () => {
  //       // Arrange
  //       const accounts = [
  //         MOCK_SOLANA_KEYRING_ACCOUNT_0,
  //         MOCK_SOLANA_KEYRING_ACCOUNT_1,
  //       ];
  //       const existingSignatures: Signature[] = [
  //         'signature1',
  //         'signature2',
  //       ] as Signature[];

  //       mockKeyring.listAccounts.mockResolvedValue(accounts);
  //       mockState.getKey.mockResolvedValue(existingSignatures);

  //       // Return existing signatures (no changes)
  //       mockTransactionsService.fetchLatestSignatures.mockResolvedValue([
  //         'signature1',
  //       ] as Signature[]);

  //       const request = {
  //         id: '1',
  //         jsonrpc: '2.0' as const,
  //         method: 'onCronjob',
  //         params: {},
  //       };

  //       await onAccountsRefresh({ request });

  //       // Assert
  //       expect(mockAssetsService.refreshAssets).not.toHaveBeenCalled();
  //       expect(
  //         mockTransactionsService.refreshTransactions,
  //       ).not.toHaveBeenCalled();
  //       expect(mockLogger.info).toHaveBeenCalledWith(
  //         '[onAccountsRefresh] No accounts with changes, skipping refresh',
  //       );
  //     });

  //     it('should skip refresh when no latest signatures are found', async () => {
  //       // Arrange
  //       const accounts = [MOCK_SOLANA_KEYRING_ACCOUNT_0];

  //       mockKeyring.listAccounts.mockResolvedValue(accounts);
  //       mockState.getKey.mockResolvedValue([]);
  //       mockTransactionsService.fetchLatestSignatures.mockResolvedValue([]); // No signatures found

  //       const request = {
  //         id: '1',
  //         jsonrpc: '2.0' as const,
  //         method: 'onCronjob',
  //         params: {},
  //       };

  //       await onAccountsRefresh({ request });

  //       // Assert
  //       expect(mockAssetsService.refreshAssets).not.toHaveBeenCalled();
  //       expect(
  //         mockTransactionsService.refreshTransactions,
  //       ).not.toHaveBeenCalled();
  //       expect(mockLogger.info).toHaveBeenCalledWith(
  //         '[onAccountsRefresh] No accounts with changes, skipping refresh',
  //       );
  //     });
  //   });

  //   describe('when no accounts exist', () => {
  //     it('should handle empty accounts list gracefully', async () => {
  //       // Arrange
  //       mockKeyring.listAccounts.mockResolvedValue([]);

  //       // Act
  //       await onAccountsRefresh();

  //       // Assert
  //       expect(mockState.getKey).not.toHaveBeenCalled();
  //       expect(
  //         mockTransactionsService.fetchLatestSignatures,
  //       ).not.toHaveBeenCalled();
  //       expect(mockAssetsService.refreshAssets).not.toHaveBeenCalled();
  //       expect(
  //         mockTransactionsService.refreshTransactions,
  //       ).not.toHaveBeenCalled();
  //       expect(mockLogger.info).toHaveBeenCalledWith(
  //         '[onAccountsRefresh] No accounts with changes, skipping refresh',
  //       );
  //     });
  //   });

  //   describe('error handling', () => {
  //     it('should handle errors during assets refresh gracefully', async () => {
  //       // Arrange
  //       const accounts = [MOCK_SOLANA_KEYRING_ACCOUNT_0];
  //       const assetsError = new Error('Assets service failed');

  //       mockKeyring.listAccounts.mockResolvedValue(accounts);
  //       mockState.getKey.mockResolvedValue([]);
  //       mockTransactionsService.fetchLatestSignatures.mockResolvedValue([
  //         'newSig',
  //       ] as Signature[]);
  //       mockAssetsService.refreshAssets.mockRejectedValue(assetsError);
  //       mockTransactionsService.refreshTransactions.mockResolvedValue();

  //       // Act
  //       await onAccountsRefresh();

  //       // Assert
  //       expect(mockLogger.warn).toHaveBeenCalledWith(
  //         '[onAccountsRefresh] Caught error while refreshing assets',
  //         assetsError,
  //       );
  //       expect(mockTransactionsService.refreshTransactions).toHaveBeenCalled(); // Should still continue
  //     });

  //     it('should handle errors during transactions refresh gracefully', async () => {
  //       // Arrange
  //       const accounts = [MOCK_SOLANA_KEYRING_ACCOUNT_0];
  //       const transactionsError = new Error('Transactions service failed');

  //       mockKeyring.listAccounts.mockResolvedValue(accounts);
  //       mockState.getKey.mockResolvedValue([]);
  //       mockTransactionsService.fetchLatestSignatures.mockResolvedValue([
  //         'newSig',
  //       ] as Signature[]);
  //       mockAssetsService.refreshAssets.mockResolvedValue();
  //       mockTransactionsService.refreshTransactions.mockRejectedValue(
  //         transactionsError,
  //       );

  //       // Act
  //       await onAccountsRefresh();

  //       // Assert
  //       expect(mockLogger.warn).toHaveBeenCalledWith(
  //         '[onAccountsRefresh] Caught error while refreshing transactions',
  //         transactionsError,
  //       );
  //     });

  //     it('should handle critical errors and log them', async () => {
  //       // Arrange
  //       const criticalError = new Error('Critical failure');
  //       mockKeyring.listAccounts.mockRejectedValue(criticalError);

  //       // Act
  //       await onAccountsRefresh();

  //       // Assert
  //       expect(mockLogger.error).toHaveBeenCalledWith(
  //         '[onAccountsRefresh] Error',
  //         criticalError,
  //       );
  //     });

  //     it('should handle errors during signature fetching', async () => {
  //       // Arrange
  //       const accounts = [MOCK_SOLANA_KEYRING_ACCOUNT_0];
  //       const signatureError = new Error('Signature fetch failed');

  //       mockKeyring.listAccounts.mockResolvedValue(accounts);
  //       mockState.getKey.mockResolvedValue([]);
  //       mockTransactionsService.fetchLatestSignatures.mockRejectedValue(
  //         signatureError,
  //       );

  //       // Act
  //       await onAccountsRefresh();

  //       // Assert
  //       expect(mockLogger.error).toHaveBeenCalledWith(
  //         '[onAccountsRefresh] Error',
  //         signatureError,
  //       );
  //     });
  //   });
});
