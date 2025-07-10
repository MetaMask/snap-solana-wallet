/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { address, lamports } from '@solana/kit';

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
import type { RpcAccountMonitor } from '../subscriptions';
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
  let onAccountChanged: (notification: any, params: any) => Promise<void>;

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
    (mockRpcAccountMonitor.monitor as jest.Mock).mockImplementation(
      async (params) => {
        onAccountChanged = params.onAccountChanged;
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

    mockTransactionsService = {} as unknown as TransactionsService;

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

  describe('#monitorAllAccountsAssets', () => {
    it('monitors all assets for all accounts in all active networks', async () => {
      // Setup 2 active networks
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet, Network.Devnet],
      } as unknown as Config);

      // Setup 2 keyring accounts
      jest
        .spyOn(mockAccountService, 'getAll')
        .mockResolvedValueOnce([
          MOCK_SOLANA_KEYRING_ACCOUNTS[0],
          MOCK_SOLANA_KEYRING_ACCOUNTS[1],
        ]);

      // Set up the assets: each account has 2 token assets in total (accross both networks and both program IDs)
      jest
        .spyOn(mockAssetsService, 'getTokenAccountsByOwnerMultiple')
        .mockResolvedValue(mockTokenAccountsWithMetadata);

      // Simulate a onStart event to start monitoring
      await mockEventEmitter.emitSync('onStart');

      /**
       * We expect 8 calls to monitor:
       * - Monitor the native asset for each account in each network (2 accounts × 2 networks = 4)
       * - Monitor the token assets for each account (2 accounts × 2 tokens = 4)
       */
      expect(mockRpcAccountMonitor.monitor).toHaveBeenCalledTimes(8);
    });

    it('updates the state and notifies the extension when the native asset balance changes', async () => {
      // Setup 1 active network
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);

      // Setup 1 keyring account
      jest
        .spyOn(mockAccountService, 'getAll')
        .mockResolvedValueOnce([MOCK_SOLANA_KEYRING_ACCOUNTS[0]]);

      // Set up no assets
      jest
        .spyOn(mockAssetsService, 'getTokenAccountsByOwnerMultiple')
        .mockResolvedValue([]);

      // Simulate a onStart event to start monitoring
      await mockEventEmitter.emitSync('onStart');

      // Simulate a notification on the account
      const mockNotification = {
        context: {
          slot: BigInt(123),
        },
        value: {
          executable: false,
          lamports: lamports(1000000000n), // 1 SOL
          owner: address('11111111111111111111111111111111'),
          rentEpoch: BigInt(361),
          space: BigInt(0),
          data: null,
        },
      };

      const mockParams = {
        address: MOCK_SOLANA_KEYRING_ACCOUNTS[0].address,
        commitment: 'confirmed' as const,
        network: Network.Mainnet,
        onAccountChanged: jest.fn(),
      };

      await onAccountChanged(mockNotification, mockParams);

      expect(mockAssetsService.saveAsset).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNTS[0],
        KnownCaip19Id.SolMainnet,
        { amount: '1', unit: 'SOL' },
      );
    });

    it('updates state and emits event when token account balance changes', async () => {
      // Setup 1 active network
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);

      // Setup 1 keyring account
      jest
        .spyOn(mockAccountService, 'getAll')
        .mockResolvedValueOnce([MOCK_SOLANA_KEYRING_ACCOUNTS[0]]);

      // Account has 1 token asset on Mainnet for first program ID, and nothing else
      jest
        .spyOn(mockAssetsService, 'getTokenAccountsByOwnerMultiple')
        .mockResolvedValue(mockTokenAccountsWithMetadata.slice(0, 1));

      // Mock token account to be monitored
      const mockTokenAccount = {
        pubkey: address('AxjEBpbCGoDuNP5CP7B8y1cWs76vEM3bwhJdvUGVn8Aw'),
        scope: Network.Mainnet,
        mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        assetType: KnownCaip19Id.UsdcMainnet,
        amount: '1000000', // 1 USDC (assuming 6 decimals)
        decimals: 6,
        owner: MOCK_SOLANA_KEYRING_ACCOUNTS[0].address,
      };

      // Simulate a onStart event to start monitoring
      await mockEventEmitter.emitSync('onStart');

      // Simulate a notification on the token account
      const mockTokenNotification = {
        context: {
          slot: 456n,
        },
        value: {
          data: {
            parsed: {
              info: {
                isNative: false,
                mint: mockTokenAccount.mint,
                owner: mockTokenAccount.owner,
                state: 'initialized',
                tokenAmount: {
                  amount: '2000000', // 2 USDC
                  decimals: 6,
                  uiAmount: 2,
                  uiAmountString: '2',
                },
              },
              type: 'account',
            },
            program: 'spl-token',
            space: 165,
          },
          executable: false,
          lamports: lamports(1000000000n), // 1 SOL
          owner: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          rentEpoch: 18446744073709551615n,
          space: 165n,
        },
      };

      const mockTokenParams = {
        address: mockTokenAccount.pubkey,
        commitment: 'confirmed' as const,
        network: Network.Mainnet,
        onAccountChanged: jest.fn(),
      };

      // Call the token account onAccountChanged handler
      await onAccountChanged(mockTokenNotification, mockTokenParams);

      expect(mockAssetsService.saveAsset).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNTS[0],
        KnownCaip19Id.UsdcMainnet,
        { amount: '2', unit: '' }, // We're mapping empty units, because the extension is not using it, and it saves us from fetching the token metadata
      );
    });
  });

  describe('stopMonitorAccountAssets', () => {
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

      await keyringAccountMonitor.stopMonitorAccountAssets(account);

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
