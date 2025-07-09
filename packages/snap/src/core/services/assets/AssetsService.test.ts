/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import { address, lamports } from '@solana/kit';

import { EventEmitter } from '../../../infrastructure/event-emitter/EventEmitter';
import type { ICache } from '../../caching/ICache';
import { InMemoryCache } from '../../caching/InMemoryCache';
import { KnownCaip19Id, Network } from '../../constants/solana';
import type { Serializable } from '../../serialization/types';
import {
  SOLANA_MOCK_SPL_TOKENS,
  SOLANA_MOCK_TOKEN,
  SOLANA_MOCK_TOKEN_METADATA,
} from '../../test/mocks/solana-assets';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
} from '../../test/mocks/solana-keyring-accounts';
import type { ConfigProvider } from '../config';
import type { Config } from '../config/ConfigProvider';
import type { SolanaConnection } from '../connection';
import { mockLogger } from '../mocks/logger';
import { createMockConnection } from '../mocks/mockConnection';
import { MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE } from '../mocks/mockSolanaRpcResponses';
import { InMemoryState } from '../state/InMemoryState';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';
import { DEFAULT_UNENCRYPTED_STATE } from '../state/State';
import type { AccountMonitor } from '../subscriptions/AccountMonitor';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import type { TokenPricesService } from '../token-prices/TokenPrices';
import { AssetsService } from './AssetsService';

jest.mock('@metamask/keyring-snap-sdk', () => ({
  emitSnapKeyringEvent: jest.fn(),
}));

jest.mock('@solana-program/token', () => ({
  ...jest.requireActual('@solana-program/token'),
  fetchMint: jest.fn(),
  fetchToken: jest.fn(),
}));

describe('AssetsService', () => {
  let assetsService: AssetsService;
  let mockConnection: SolanaConnection;
  let mockConfigProvider: ConfigProvider;
  let mockTokenMetadataService: TokenMetadataService;
  let mockTokenPricesService: TokenPricesService;
  let mockState: IStateManager<UnencryptedStateValue>;
  let stateSetKeySpy: jest.SpyInstance;
  let mockCache: ICache<Serializable>;
  let mockAccountMonitor: AccountMonitor;
  let mockEventEmitter: EventEmitter;
  let onAccountChanged: (notification: any, params: any) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = createMockConnection();

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        activeNetworks: [Network.Localnet],
      }),
    } as unknown as ConfigProvider;

    mockTokenMetadataService = {
      getTokensMetadata: jest
        .fn()
        .mockResolvedValue(SOLANA_MOCK_TOKEN_METADATA),
    } as unknown as TokenMetadataService;

    mockTokenPricesService = {
      getMultipleTokenConversions: jest.fn().mockResolvedValue({}),
      getMultipleTokensMarketData: jest.fn().mockResolvedValue({}),
      getHistoricalPrice: jest
        .fn()
        .mockResolvedValue({ intervals: {}, updateTime: 0, expirationTime: 0 }),
    } as unknown as TokenPricesService;

    mockState = new InMemoryState(DEFAULT_UNENCRYPTED_STATE);
    stateSetKeySpy = jest.spyOn(mockState, 'setKey');

    mockCache = new InMemoryCache(mockLogger);

    mockAccountMonitor = {
      monitor: jest.fn(),
    } as unknown as AccountMonitor;

    // Mock the monitor method to capture the onAccountChanged callback
    (mockAccountMonitor.monitor as jest.Mock).mockImplementation(
      async (params) => {
        onAccountChanged = params.onAccountChanged;
        return Promise.resolve();
      },
    );

    mockEventEmitter = new EventEmitter(mockLogger);

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;

    assetsService = new AssetsService({
      connection: mockConnection,
      logger: mockLogger,
      configProvider: mockConfigProvider,
      state: mockState,
      tokenMetadataService: mockTokenMetadataService,
      tokenPricesService: mockTokenPricesService,
      cache: mockCache,
      accountMonitor: mockAccountMonitor,
      eventEmitter: mockEventEmitter,
    });
  });

  describe('listAccountAssets', () => {
    it('lists account assets', async () => {
      const mockAccount = {
        ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
        scopes: [Network.Localnet],
      };

      const assets = await assetsService.listAccountAssets(mockAccount);

      expect(assets).toStrictEqual([
        SOLANA_MOCK_TOKEN.assetType,
        ...SOLANA_MOCK_SPL_TOKENS.map((token) => token.assetType),
        ...SOLANA_MOCK_SPL_TOKENS.map((token) => token.assetType),
      ]);
    });
  });

  describe('getAccountBalances', () => {
    it('gets account balance', async () => {
      const accountBalance = await assetsService.getAccountBalances(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
        [KnownCaip19Id.SolLocalnet],
      );
      expect(accountBalance).toStrictEqual({
        [KnownCaip19Id.SolLocalnet]: {
          amount: '0.123456789',
          unit: 'SOL',
        },
      });
    });

    it('gets account and token balances', async () => {
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTokenAccountsByOwner: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({
            value:
              MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result.value,
          }),
        }),
        getBalance: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({
            value: 1250006150n,
          }),
        }),
      } as any);

      const accountBalance = await assetsService.getAccountBalances(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
        [
          KnownCaip19Id.SolLocalnet,
          KnownCaip19Id.UsdcLocalnet,
          KnownCaip19Id.Ai16zLocalnet,
        ],
      );
      expect(accountBalance).toStrictEqual({
        [KnownCaip19Id.SolLocalnet]: {
          amount: '1.25000615',
          unit: 'SOL',
        },
        [KnownCaip19Id.UsdcLocalnet]: {
          amount: '123.456789',
          unit: 'USDC',
        },
        [KnownCaip19Id.Ai16zLocalnet]: {
          amount: '0.987654321',
          unit: 'AI16Z',
        },
      });
    });

    it('throws an error if balance fails to be retrieved', async () => {
      const mockSend = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error getting assets'));
      const mockGetBalance = jest.fn().mockReturnValue({ send: mockSend });
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: mockGetBalance,
        getTokenAccountsByOwner: mockGetBalance,
      } as any);

      await expect(
        assetsService.getAccountBalances(MOCK_SOLANA_KEYRING_ACCOUNT_0, [
          KnownCaip19Id.SolMainnet,
        ]),
      ).rejects.toThrow('Error getting assets');
    });
  });

  describe('refreshAssets', () => {
    const mockAccounts = [
      MOCK_SOLANA_KEYRING_ACCOUNTS[0],
      MOCK_SOLANA_KEYRING_ACCOUNTS[1],
    ];

    it('skips if no accounts passed', async () => {
      await assetsService.refreshAssets([]);

      expect(stateSetKeySpy).not.toHaveBeenCalled();
    });

    it('emits events when assets list changes', async () => {
      // Mock initial state
      jest.spyOn(mockState, 'getKey').mockResolvedValueOnce({
        [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
          [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
        },
      });

      // Mock new assets being discovered for both accounts
      jest
        .spyOn(assetsService, 'listAccountAssets')
        .mockResolvedValueOnce([
          KnownCaip19Id.SolLocalnet,
          KnownCaip19Id.UsdcLocalnet,
        ])
        .mockResolvedValueOnce([
          KnownCaip19Id.SolLocalnet,
          KnownCaip19Id.UsdcLocalnet,
        ]);

      // Mock balance fetching for both accounts
      jest
        .spyOn(assetsService, 'getAccountBalances')
        .mockResolvedValueOnce({
          [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
          [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
        })
        .mockResolvedValueOnce({
          [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
          [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
        });

      await assetsService.refreshAssets(mockAccounts);

      expect(emitSnapKeyringEvent).toHaveBeenCalledTimes(4);

      expect(emitSnapKeyringEvent).toHaveBeenNthCalledWith(
        1,
        snap,
        KeyringEvent.AccountAssetListUpdated,
        {
          assets: {
            [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
              added: [KnownCaip19Id.UsdcLocalnet],
              removed: [],
            },
          },
        },
      );

      expect(emitSnapKeyringEvent).toHaveBeenNthCalledWith(
        2,
        snap,
        KeyringEvent.AccountBalancesUpdated,
        {
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
              [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
            },
          },
        },
      );

      expect(emitSnapKeyringEvent).toHaveBeenNthCalledWith(
        3,
        snap,
        KeyringEvent.AccountAssetListUpdated,
        {
          assets: {
            [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: {
              added: [KnownCaip19Id.SolLocalnet, KnownCaip19Id.UsdcLocalnet],
              removed: [],
            },
          },
        },
      );

      expect(emitSnapKeyringEvent).toHaveBeenNthCalledWith(
        4,
        snap,
        KeyringEvent.AccountBalancesUpdated,
        {
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: {
              [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
              [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
            },
          },
        },
      );
    });
  });

  describe('#monitorAllAccountsAssets', () => {
    it('monitors all assets for all accounts in all active networks', async () => {
      // Setup 2 active networks
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Localnet, Network.Mainnet],
      } as unknown as Config);

      // Setup 2 keyring accounts
      jest.spyOn(mockState, 'getKey').mockResolvedValueOnce({
        [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[0],
        [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[1],
      });

      // Set up the assets: each account has 2 token assets on each network and for each program ID
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTokenAccountsByOwner: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({
            value:
              MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result.value,
          }),
        }),
      } as any);

      // Simulate a onStart event to start monitoring
      await mockEventEmitter.emitSync('onStart');

      /**
       * We expect 8 calls to monitor:
       * - Monitor the native asset for each account in each network (2 accounts × 2 networks = 4)
       * - Monitor the token assets for each account (2 accounts × 2 networks × 2 program IDs x 2 tokens = 16)
       */
      expect(mockAccountMonitor.monitor).toHaveBeenCalledTimes(20);
    });

    it('updates the state and notifies the extension when the native asset balance changes', async () => {
      // Setup 1 active network
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);

      // Setup 1 keyring account
      jest.spyOn(mockState, 'getKey').mockResolvedValueOnce({
        [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[0],
      });

      // Set up no assets
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTokenAccountsByOwner: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({
            value: [],
          }),
        }),
      } as any);

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

      expect(stateSetKeySpy).toHaveBeenCalledWith(
        `assets.${MOCK_SOLANA_KEYRING_ACCOUNTS[0].id}.${KnownCaip19Id.SolMainnet}`,
        { amount: '1', unit: 'SOL' },
      );

      expect(emitSnapKeyringEvent).toHaveBeenCalledWith(
        snap,
        KeyringEvent.AccountBalancesUpdated,
        {
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
              [KnownCaip19Id.SolMainnet]: { amount: '1', unit: 'SOL' },
            },
          },
        },
      );
    });

    it('updates state and emits event when token account balance changes', async () => {
      // Setup 1 active network
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);

      // Setup 1 keyring account
      jest.spyOn(mockState, 'getKey').mockResolvedValueOnce({
        [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[0],
      });

      // Account has 1 token asset on Mainnet for first program ID, and nothing else
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTokenAccountsByOwner: jest.fn().mockReturnValue({
          send: jest
            .fn()
            .mockResolvedValueOnce({
              value:
                MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result.value.slice(
                  0,
                  1,
                ),
            })
            .mockResolvedValue({
              value: [],
            }),
        }),
      } as any);

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

      expect(stateSetKeySpy).toHaveBeenCalledWith(
        `assets.${MOCK_SOLANA_KEYRING_ACCOUNTS[0].id}.${KnownCaip19Id.UsdcMainnet}`,
        { amount: '2', unit: '' }, // We're mapping empty units, because the extension is not using it, and it saves us from fetching the token metadata
      );

      expect(emitSnapKeyringEvent).toHaveBeenCalledWith(
        snap,
        KeyringEvent.AccountBalancesUpdated,
        {
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
              [KnownCaip19Id.UsdcMainnet]: { amount: '2', unit: '' },
            },
          },
        },
      );
    });
  });
});
