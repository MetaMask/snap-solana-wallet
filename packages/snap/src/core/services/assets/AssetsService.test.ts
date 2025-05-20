/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import { fetchMint, fetchToken } from '@solana-program/token';

import type { ICache } from '../../caching/ICache';
import { InMemoryCache } from '../../caching/InMemoryCache';
import { KnownCaip19Id, Network } from '../../constants/solana';
import type { Serializable } from '../../serialization/types';
import {
  MOCK_FETCH_MINT_RESPONSES,
  SOLANA_MOCK_SPL_TOKENS,
  SOLANA_MOCK_TOKEN,
  SOLANA_MOCK_TOKEN_METADATA,
} from '../../test/mocks/solana-assets';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
} from '../../test/mocks/solana-keyring-accounts';
import logger from '../../utils/logger';
import type { ConfigProvider } from '../config';
import type { SolanaConnection } from '../connection';
import { createMockConnection } from '../mocks/mockConnection';
import { MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE } from '../mocks/mockSolanaRpcResponses';
import { InMemoryState } from '../state/InMemoryState';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';
import { DEFAULT_UNENCRYPTED_STATE } from '../state/State';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
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
  let mockState: IStateManager<UnencryptedStateValue>;
  let stateUpdateSpy: jest.SpyInstance;
  let mockCache: ICache<Serializable>;

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

    mockState = new InMemoryState(DEFAULT_UNENCRYPTED_STATE);

    mockCache = new InMemoryCache();

    stateUpdateSpy = jest.spyOn(mockState, 'update');

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;

    assetsService = new AssetsService({
      connection: mockConnection,
      logger,
      configProvider: mockConfigProvider,
      state: mockState,
      tokenMetadataService: mockTokenMetadataService,
      cache: mockCache,
    });
  });

  describe('listAccountAssets', () => {
    it('lists account assets', async () => {
      const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const assets = await assetsService.listAccountAssets(mockAccount);
      expect(assets).toStrictEqual([
        SOLANA_MOCK_TOKEN.assetType,
        ...SOLANA_MOCK_SPL_TOKENS.map((token) => token.assetType),
        ...SOLANA_MOCK_SPL_TOKENS.map((token) => token.assetType),
      ]);
    });
  });

  describe('discoverTokens', () => {
    it('discovers tokens with non-zero balance', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

      // First send is when we getTokenAccountsByOwner for programId: TOKEN_PROGRAM_ADDRESS
      const mockFirstSend = jest.fn().mockReturnValue({
        context: {
          slot: 302900219n,
        },
        value:
          MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result.value,
      });

      // First send is when we getTokenAccountsByOwner for programId: TOKEN_2022_PROGRAM_ADDRESS
      const mockSecondSend = jest.fn().mockResolvedValue({
        context: {
          slot: 302900219n,
        },
        value: [],
      });

      const mockGetTokenAccountsByOwner = jest
        .fn()
        .mockReturnValueOnce({ send: mockFirstSend })
        .mockReturnValueOnce({ send: mockSecondSend });

      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTokenAccountsByOwner: mockGetTokenAccountsByOwner,
      } as any);

      const tokens = await assetsService.discoverTokens(address, scope);

      expect(tokens).toStrictEqual(SOLANA_MOCK_SPL_TOKENS);
    });

    it('throws an error if the RPC call fails', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

      const mockSend = jest.fn().mockRejectedValue(new Error('Network error'));
      const mockGetTokenAccountsByOwner = jest
        .fn()
        .mockReturnValue({ send: mockSend });
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTokenAccountsByOwner: mockGetTokenAccountsByOwner,
      } as any);

      await expect(
        assetsService.discoverTokens(address, scope),
      ).rejects.toThrow('Network error');
    });

    it('throws an error if the response from the RPC is not valid', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

      const mockResponse = {
        context: {
          slot: 302900219n,
        },
        value: [
          {
            account: {
              data: {
                parsed: null, // Missing parsed data
              },
            },
          },
        ],
      };

      const mockSend = jest.fn().mockReturnValue(mockResponse);
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTokenAccountsByOwner: jest.fn().mockReturnValue({ send: mockSend }),
      } as any);

      await expect(
        assetsService.discoverTokens(address, scope),
      ).rejects.toThrow(
        'At path: value.0.account.data.parsed -- Expected an object, but received: null',
      );
    });
  });

  describe('getNativeAsset', () => {
    it('gets native asset', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

      const nativeAsset = await assetsService.getNativeAsset(address, scope);

      expect(nativeAsset).toStrictEqual(SOLANA_MOCK_TOKEN);
    });

    it('throws an error if the RPC call fails', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

      const mockSend = jest.fn().mockRejectedValue(new Error('Network error'));
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: jest.fn().mockReturnValue({ send: mockSend }),
      } as any);

      await expect(
        assetsService.getNativeAsset(address, scope),
      ).rejects.toThrow('Network error');
    });

    it('throws an error if the response from the RPC is not valid', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

      const mockResponse = {
        context: {
          slot: 4, // not a bigint
        },
        value: 12345n,
      };
      const mockSend = jest.fn().mockReturnValue(mockResponse);
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: jest.fn().mockReturnValue({ send: mockSend }),
      } as any);

      await expect(
        assetsService.getNativeAsset(address, scope),
      ).rejects.toThrow(
        'At path: context.slot -- Expected a value of type `bigint`, but received: `4`',
      );
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
        getBalance: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({
            value: 1250006150n,
          }),
        }),
      } as any);

      jest
        .mocked(fetchMint)
        .mockResolvedValueOnce(
          MOCK_FETCH_MINT_RESPONSES[KnownCaip19Id.UsdcLocalnet]!,
        )
        .mockResolvedValueOnce(
          MOCK_FETCH_MINT_RESPONSES[KnownCaip19Id.Ai16zLocalnet]!,
        );

      jest
        .mocked(fetchToken)
        .mockResolvedValueOnce({
          data: {
            amount: 17552148n,
          },
        } as any)
        .mockResolvedValueOnce({
          data: {
            amount: 21898077n,
          },
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
          amount: '17.552148',
          unit: 'USDC',
        },
        [KnownCaip19Id.Ai16zLocalnet]: {
          amount: '0.021898077',
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

    it('uses the cache for the mint account', async () => {
      jest
        .mocked(fetchMint)
        .mockResolvedValue(
          MOCK_FETCH_MINT_RESPONSES[KnownCaip19Id.UsdcLocalnet]!,
        );
      jest.mocked(fetchToken).mockResolvedValue({
        data: {
          amount: 17552148n,
        },
      } as any);

      // Call once
      await assetsService.getAccountBalances(MOCK_SOLANA_KEYRING_ACCOUNT_0, [
        KnownCaip19Id.UsdcLocalnet,
      ]);
      const cacheKey = `fetchMint:${KnownCaip19Id.UsdcLocalnet}`;
      const cacheValue = await mockCache.get(cacheKey);

      expect(cacheValue).toStrictEqual(
        MOCK_FETCH_MINT_RESPONSES[KnownCaip19Id.UsdcLocalnet],
      );

      // Call again
      await assetsService.getAccountBalances(MOCK_SOLANA_KEYRING_ACCOUNT_0, [
        KnownCaip19Id.UsdcLocalnet,
      ]);

      // fetchMint should have been called once in total
      expect(fetchMint).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshAssets', () => {
    const mockAccounts = [
      MOCK_SOLANA_KEYRING_ACCOUNTS[0],
      MOCK_SOLANA_KEYRING_ACCOUNTS[1],
    ];

    it('skips if no accounts passed', async () => {
      await assetsService.refreshAssets([]);

      expect(stateUpdateSpy).not.toHaveBeenCalled();
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
});
