import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';

import {
  KnownCaip19Id,
  Network,
  SolanaCaip19Tokens,
} from '../../constants/solana';
import {
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

describe('AssetsService', () => {
  let assetsService: AssetsService;
  let mockConnection: SolanaConnection;
  let mockConfigProvider: ConfigProvider;
  let mockTokenMetadataService: TokenMetadataService;
  let mockState: IStateManager<UnencryptedStateValue>;
  let stateUpdateSpy: jest.SpyInstance;

  beforeEach(() => {
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
    });
  });

  describe('listAccountAssets', () => {
    it('lists account assets', async () => {
      const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const assets = await assetsService.listAccountAssets(mockAccount);
      expect(assets).toStrictEqual([
        SOLANA_MOCK_TOKEN.address,
        ...SOLANA_MOCK_SPL_TOKENS.map((token) => token.address),
        ...SOLANA_MOCK_SPL_TOKENS.map((token) => token.address),
      ]);
    });
  });

  describe('discoverTokens', () => {
    it('discovers tokens with non-zero balance', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

      const mockSend = jest.fn().mockReturnValue({
        context: {
          slot: 302900219n,
        },
        value: [
          ...MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result.value,
          // adding a 0 balance token to the response in purpose
          // to test the filtering of zero balance tokens
          {
            account: {
              data: {
                parsed: {
                  info: {
                    mint: 'tokenAddress1',
                    owner: 'owner1',
                    isNative: false,
                    tokenAmount: {
                      amount: '0',
                      decimals: 6,
                    },
                  },
                },
              },
            },
          },
        ],
      });

      const mockGetTokenAccountsByOwner = jest
        .fn()
        .mockReturnValue({ send: mockSend });
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTokenAccountsByOwner: mockGetTokenAccountsByOwner,
      } as any);

      const tokens = await assetsService.discoverTokens(address, scope);

      expect(tokens).toStrictEqual([
        ...SOLANA_MOCK_SPL_TOKENS,
        {
          address: 'solana:123456789abcdef/token:tokenAddress1',
          balance: '0',
          decimals: 6,
          native: false,
          scope: Network.Localnet,
        },
        ...SOLANA_MOCK_SPL_TOKENS,
        {
          address: 'solana:123456789abcdef/token:tokenAddress1',
          balance: '0',
          decimals: 6,
          native: false,
          scope: Network.Localnet,
        },
      ]);
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
        MOCK_SOLANA_KEYRING_ACCOUNT_1,
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
      const accountBalance = await assetsService.getAccountBalances(
        MOCK_SOLANA_KEYRING_ACCOUNT_1,
        [
          `${Network.Localnet}/${SolanaCaip19Tokens.SOL}`,
          `${Network.Localnet}/token:address1`,
          `${Network.Localnet}/token:address2`,
        ],
      );
      expect(accountBalance).toStrictEqual({
        [`${Network.Localnet}/${SolanaCaip19Tokens.SOL}`]: {
          amount: '0.123456789',
          unit: 'SOL',
        },
        [`${Network.Localnet}/token:address1`]: {
          amount: '0.123456789',
          unit: 'MOCK1',
        },
        [`${Network.Localnet}/token:address2`]: {
          amount: '0.987654321',
          unit: 'MOCK2',
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
        assetsService.getAccountBalances(MOCK_SOLANA_KEYRING_ACCOUNT_1, [
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
