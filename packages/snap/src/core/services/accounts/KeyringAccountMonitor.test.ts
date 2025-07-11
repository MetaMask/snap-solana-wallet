/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Transaction } from '@metamask/keyring-api';
import { lamports, signature } from '@solana/kit';

import { EventEmitter } from '../../../infrastructure';
import { KnownCaip19Id, Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../test/mocks/solana-keyring-accounts';
import type {
  AssetsService,
  TokenAccountWithMetadata,
} from '../assets/AssetsService';
import type { ConfigProvider } from '../config';
import type { Config } from '../config/ConfigProvider';
import { mockLogger } from '../mocks/logger';
import { MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE } from '../mocks/mockSolanaRpcResponses';
import type {
  AccountNotification,
  RpcAccountMonitor,
  RpcAccountMonitoringParams,
} from '../subscriptions';
import type { TransactionsService } from '../transactions/TransactionsService';
import type { AccountService } from './AccountService';
import { KeyringAccountMonitor } from './KeyringAccountMonitor';

describe('KeyringAccountMonitor', () => {
  let keyringAccountMonitor: KeyringAccountMonitor;
  let mockRpcAccountMonitor: RpcAccountMonitor;
  let mockAccountService: AccountService;
  let mockAssetsService: AssetsService;
  let mockTransactionsService: TransactionsService;
  let mockConfigProvider: ConfigProvider;
  let mockEventEmitter: EventEmitter;

  // Store multiple callbacks keyed by address
  const accountCallbacks: Map<
    string,
    (
      notification: AccountNotification,
      params: RpcAccountMonitoringParams,
    ) => Promise<void>
  > = new Map();

  const mockTokenAccountWithMetadata0 = {
    ...MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result.value[0],
    scope: Network.Mainnet,
    assetType: KnownCaip19Id.UsdcMainnet,
  } as unknown as TokenAccountWithMetadata;

  const mockTokenAccountWithMetadata1 = {
    ...MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result.value[1],
    scope: Network.Mainnet,
    assetType: KnownCaip19Id.UsdcMainnet,
  } as unknown as TokenAccountWithMetadata;

  const mockTokenAccountsWithMetadata: TokenAccountWithMetadata[] = [
    mockTokenAccountWithMetadata0,
    mockTokenAccountWithMetadata1,
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockRpcAccountMonitor = {
      monitor: jest.fn(),
      stopMonitoring: jest.fn(),
    } as unknown as RpcAccountMonitor;

    // Mock the monitor method to capture the onAccountChanged callback
    // Mock the monitor method to capture ALL onAccountChanged callbacks
    (mockRpcAccountMonitor.monitor as jest.Mock).mockImplementation(
      async (params) => {
        // Store the callback keyed by the address being monitored
        accountCallbacks.set(params.address, params.onAccountChanged);
        return Promise.resolve();
      },
    );

    mockAccountService = {
      getAll: jest.fn(),
    } as unknown as AccountService;

    mockAssetsService = {
      getTokenAccountsByOwnerMultiple: jest.fn(),
      saveAsset: jest.fn(),
    } as unknown as AssetsService;

    mockTransactionsService = {
      fetchLatestSignatures: jest.fn(),
      fetchBySignature: jest.fn(),
      saveTransaction: jest.fn(),
    } as unknown as TransactionsService;

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        activeNetworks: [Network.Mainnet],
      }),
    } as unknown as ConfigProvider;

    mockEventEmitter = new EventEmitter(mockLogger);

    keyringAccountMonitor = new KeyringAccountMonitor(
      mockRpcAccountMonitor,
      mockAccountService,
      mockAssetsService,
      mockTransactionsService,
      mockConfigProvider,
      mockEventEmitter,
      mockLogger,
    );
  });

  describe('#monitorAllKeyringAccounts', () => {
    it('monitors all keyring accounts', async () => {
      // Setup 2 keyring accounts
      jest
        .spyOn(mockAccountService, 'getAll')
        .mockResolvedValue([
          MOCK_SOLANA_KEYRING_ACCOUNTS[0],
          MOCK_SOLANA_KEYRING_ACCOUNTS[1],
        ]);

      jest
        .spyOn(keyringAccountMonitor, 'monitorKeyringAccount')
        .mockResolvedValue(undefined);

      // Simulate a onStart event to start monitoring
      await mockEventEmitter.emitSync('onStart');

      expect(keyringAccountMonitor.monitorKeyringAccount).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  describe('monitorKeyringAccount', () => {
    const account = MOCK_SOLANA_KEYRING_ACCOUNTS[0];

    it('monitors the account native and token assets on all active networks', async () => {
      // Setup 2 active networks
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet, Network.Devnet],
      } as unknown as Config);

      // Set up assets. Account has 2 token assets in total (across both networks and both program IDs)
      jest
        .spyOn(mockAssetsService, 'getTokenAccountsByOwnerMultiple')
        .mockResolvedValue(mockTokenAccountsWithMetadata);

      await keyringAccountMonitor.monitorKeyringAccount(account);

      /**
       * We expect 4 calls to monitor:
       * - Monitor the native asset in each network (1 account × 2 networks = 2)
       * - Monitor each token asset for the account (1 account × 2 tokens = 2)
       */
      expect(mockRpcAccountMonitor.monitor).toHaveBeenCalledTimes(4);
    });

    it('does not monitor an account already monitored', async () => {
      // Setup 1 active network
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);

      // Set up no assets for simplicity
      jest
        .spyOn(mockAssetsService, 'getTokenAccountsByOwnerMultiple')
        .mockResolvedValue([]);

      // Try to monitor the same account twice
      await keyringAccountMonitor.monitorKeyringAccount(account);
      await keyringAccountMonitor.monitorKeyringAccount(account);

      expect(mockRpcAccountMonitor.monitor).toHaveBeenCalledTimes(1);
    });

    describe('when receiving a notification', () => {
      const mockSignature = signature(
        '4Pjp2FVBTA2FQCbF3UurnHES3hz2Zx5pTJeVEVhvcCCS7m5CytKqLvcQUGiUMPSBVW5V3dL5N8jwXpT8eV52Sw7b',
      );

      const mockCausingTransaction = {
        id: mockSignature.toString(),
      } as unknown as Transaction;

      beforeEach(() => {
        // Setup 1 active network for simplicity
        jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
          activeNetworks: [Network.Mainnet],
        } as unknown as Config);

        jest
          .spyOn(mockTransactionsService, 'fetchLatestSignatures')
          .mockResolvedValue([mockSignature]);

        jest
          .spyOn(mockTransactionsService, 'fetchBySignature')
          .mockResolvedValue(mockCausingTransaction);
      });

      describe('when the native asset changed', () => {
        const mockNotification = {
          value: {
            lamports: lamports(1000000000n), // 1 SOL
          },
        } as unknown as AccountNotification;

        const mockParams = {
          address: account.address,
          commitment: 'confirmed' as const,
          network: Network.Mainnet,
          onAccountChanged: jest.fn(),
        };

        beforeEach(() => {
          // Set up no token assets for simplicity
          jest
            .spyOn(mockAssetsService, 'getTokenAccountsByOwnerMultiple')
            .mockResolvedValue([]);
        });

        it('saves the new balance of the native asset', async () => {
          await keyringAccountMonitor.monitorKeyringAccount(account);

          // Get the specific callback for the token account and call it
          const tokenAccountCallback = accountCallbacks.get(account.address)!;
          await tokenAccountCallback(mockNotification, mockParams);

          expect(mockAssetsService.saveAsset).toHaveBeenCalledWith(
            account,
            KnownCaip19Id.SolMainnet,
            { amount: '1', unit: 'SOL' },
          );
        });

        it('fetches and saves the transaction that caused the native asset balance to change', async () => {
          await keyringAccountMonitor.monitorKeyringAccount(account);

          // Get the specific callback for the token account
          const tokenAccountCallback = accountCallbacks.get(account.address)!;

          // Call the callback
          await tokenAccountCallback(mockNotification, mockParams);

          expect(mockTransactionsService.saveTransaction).toHaveBeenCalledWith(
            mockCausingTransaction,
            account,
          );
        });
      });

      describe('when a token asset changed', () => {
        const mockTokenAccount = mockTokenAccountWithMetadata0;

        const mockNotification = {
          value: {
            data: {
              parsed: {
                info: {
                  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                  tokenAmount: {
                    uiAmountString: '123456789',
                  },
                },
              },
            },
          },
        } as unknown as AccountNotification;

        const mockParams = {
          address: mockTokenAccount.pubkey,
          commitment: 'confirmed' as const,
          network: Network.Mainnet,
          onAccountChanged: jest.fn(),
        };

        beforeEach(() => {
          jest
            .spyOn(mockAssetsService, 'getTokenAccountsByOwnerMultiple')
            .mockResolvedValue([mockTokenAccount]);
        });

        it('saves the new balance of the token asset', async () => {
          await keyringAccountMonitor.monitorKeyringAccount(account);

          // Get the specific callback for the token account and call it
          const tokenAccountCallback = accountCallbacks.get(
            mockTokenAccount.pubkey,
          )!;
          await tokenAccountCallback(mockNotification, mockParams);

          expect(mockAssetsService.saveAsset).toHaveBeenCalledWith(
            account,
            KnownCaip19Id.UsdcMainnet,
            { amount: '123456789', unit: '' },
          );
        });

        it.todo(
          'fetches and saves the transaction that caused the token asset to change',
        );
      });
    });
  });

  describe('stopMonitorKeyringAccount', () => {
    it('stops monitoring the account native and token assets on all active networks', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNTS[0];

      // Setup 2 active networks
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet, Network.Devnet],
      } as unknown as Config);

      // Set up assets
      jest
        .spyOn(mockAssetsService, 'getTokenAccountsByOwnerMultiple')
        // 2 token assets on first network and first program ID
        .mockResolvedValueOnce(mockTokenAccountsWithMetadata)
        // No token asset for the rest
        .mockResolvedValue([]);

      await keyringAccountMonitor.stopMonitorKeyringAccount(account);

      /**
       * List of expected calls to stopMonitoring:
       * - 1 for the native asset on Mainnet and Devnet -> 2 calls
       * - 1 for token asset on token-program on Mainnet -> 1 call
       * - 1 for token asset on token-2022-program on Mainnet -> 1 call
       * - no token asset on Devnet -> 0 call
       */
      expect(mockRpcAccountMonitor.stopMonitoring).toHaveBeenCalledTimes(4);
      expect(mockRpcAccountMonitor.stopMonitoring).toHaveBeenCalledWith(
        'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        Network.Mainnet,
      );
      expect(mockRpcAccountMonitor.stopMonitoring).toHaveBeenCalledWith(
        'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        Network.Devnet,
      );
      expect(mockRpcAccountMonitor.stopMonitoring).toHaveBeenCalledWith(
        '9wt9PfjPD3JCy5r7o4K1cTGiuTG7fq2pQhdDCdQALKjg',
        Network.Mainnet,
      );
      expect(mockRpcAccountMonitor.stopMonitoring).toHaveBeenCalledWith(
        'DJGpJufSnVDriDczovhcQRyxamKtt87PHQ7TJEcVB6ta',
        Network.Mainnet,
      );
    });
  });
});
