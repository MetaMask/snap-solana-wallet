/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import { cloneDeep } from 'lodash';

import type { AssetEntity } from '../../../entities';
import type { ICache } from '../../caching/ICache';
import { InMemoryCache } from '../../caching/InMemoryCache';
import { MOCK_NFTS_LIST_RESPONSE_MAPPED } from '../../clients/nft-api/mocks/mockNftsListResponseMapped';
import type { NftApiClient } from '../../clients/nft-api/NftApiClient';
import type { TokenApiClient } from '../../clients/token-api-client/TokenApiClient';
import { Network } from '../../constants/solana';
import type { Serializable } from '../../serialization/types';
import {
  MOCK_ASSET_ENTITIES,
  MOCK_ASSET_ENTITY_0,
  MOCK_ASSET_ENTITY_1,
  MOCK_ASSET_ENTITY_2,
  SOLANA_MOCK_TOKEN_METADATA,
} from '../../test/mocks/asset-entities';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import type { AccountsService } from '../accounts/AccountsService';
import type { ConfigProvider } from '../config';
import type { SolanaConnection } from '../connection';
import { mockLogger } from '../mocks/logger';
import { createMockConnection } from '../mocks/mockConnection';
import { MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE } from '../mocks/mockSolanaRpcResponses';
import type { TokenPricesService } from '../token-prices/TokenPrices';
import type { AssetsRepository } from './AssetsRepository';
import { AssetsService } from './AssetsService';
import type { CoreAssetsAdapter } from './adapters/CoreAssetsAdapter';
import { SnapAssetsAdapter } from './adapters/SnapAssetsAdapter';

jest.mock('@metamask/keyring-snap-sdk', () => ({
  emitSnapKeyringEvent: jest.fn(),
}));

describe('AssetsService', () => {
  let assetsService: AssetsService;
  let snapAssetsAdapter: SnapAssetsAdapter;
  let mockConnection: SolanaConnection;
  let mockConfigProvider: ConfigProvider;
  let mockAssetsRepository: AssetsRepository;
  let mockAccountsService: AccountsService;
  let mockTokenApiClient: TokenApiClient;
  let mockTokenPricesService: TokenPricesService;
  let mockNftApiClient: NftApiClient;
  let mockCache: ICache<Serializable>;
  let mockCoreAssetsAdapter: CoreAssetsAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = createMockConnection();

    mockConfigProvider = {
      getActiveNetworks: jest.fn().mockResolvedValue([Network.Mainnet]),
    } as unknown as ConfigProvider;

    mockTokenApiClient = {
      getTokensMetadata: jest
        .fn()
        .mockResolvedValue(SOLANA_MOCK_TOKEN_METADATA),
    } as unknown as TokenApiClient;

    mockTokenPricesService = {
      getMultipleTokenConversions: jest.fn().mockResolvedValue({}),
      getMultipleTokensMarketData: jest.fn().mockResolvedValue({}),
      getHistoricalPrice: jest
        .fn()
        .mockResolvedValue({ intervals: {}, updateTime: 0, expirationTime: 0 }),
    } as unknown as TokenPricesService;

    mockCache = new InMemoryCache(mockLogger);

    mockNftApiClient = {
      listAddressSolanaNfts: jest
        .fn()
        .mockResolvedValue(MOCK_NFTS_LIST_RESPONSE_MAPPED.items),
    } as unknown as NftApiClient;

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;

    mockAssetsRepository = {
      findByKeyringAccountId: jest.fn(),
      getAll: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as AssetsRepository;

    mockAccountsService = {
      findById: jest.fn().mockResolvedValue(MOCK_SOLANA_KEYRING_ACCOUNT_0),
    } as unknown as AccountsService;

    snapAssetsAdapter = new SnapAssetsAdapter({
      connection: mockConnection,
      logger: mockLogger,
      configProvider: mockConfigProvider,
      assetsRepository: mockAssetsRepository,
      accountsService: mockAccountsService,
      tokenApiClient: mockTokenApiClient,
      cache: mockCache,
      nftApiClient: mockNftApiClient,
    });

    mockCoreAssetsAdapter = {
      getAccountAsset: jest.fn(),
      getAccountAssets: jest.fn(),
      getAccountAssetsByIds: jest.fn(),
    } as unknown as CoreAssetsAdapter;

    assetsService = new AssetsService({
      logger: mockLogger,
      configProvider: mockConfigProvider,
      snapAssetsAdapter,
      coreAssetsAdapter: mockCoreAssetsAdapter,
      accountsService: mockAccountsService,
      tokenApiClient: mockTokenApiClient,
      tokenPricesService: mockTokenPricesService,
      nftApiClient: mockNftApiClient,
    });
  });

  describe('fetch', () => {
    it('fetches native and token assets', async () => {
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: jest.fn().mockReturnValueOnce({
          send: jest.fn().mockResolvedValue({
            value: 1000000000, // Native balance on Mainnet
          }),
        }),
        getTokenAccountsByOwner: jest.fn().mockReturnValue({
          send: jest
            .fn()
            .mockResolvedValueOnce({
              value:
                MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result
                  .value,
            })
            .mockResolvedValue({
              value: [],
            }),
        }),
      } as any);

      const assets = await assetsService.fetch(MOCK_SOLANA_KEYRING_ACCOUNT_0);

      expect(assets).toStrictEqual(MOCK_ASSET_ENTITIES);
    });

    it('does not fail on individual RPC call failures to fetch native assets', async () => {
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: jest.fn().mockReturnValue({
          send: jest
            .fn()
            .mockRejectedValueOnce(new Error('Error getting balance')),
        }),
        getTokenAccountsByOwner: jest.fn().mockReturnValue({
          send: jest
            .fn()
            .mockResolvedValueOnce({
              value:
                MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result
                  .value,
            })
            .mockResolvedValue({
              value: [],
            }),
        }),
      } as any);

      const assets = await assetsService.fetch(MOCK_SOLANA_KEYRING_ACCOUNT_0);

      expect(assets).toStrictEqual([MOCK_ASSET_ENTITY_1, MOCK_ASSET_ENTITY_2]);
    });

    it('does not fail on individual RPC call failures to fetch token assets', async () => {
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: jest.fn().mockReturnValueOnce({
          send: jest.fn().mockResolvedValue({
            value: 1000000000, // Native balance on Mainnet
          }),
        }),
        getTokenAccountsByOwner: jest.fn().mockReturnValue({
          send: jest
            .fn()
            .mockRejectedValueOnce(new Error('Error getting token accounts')),
        }),
      } as any);

      const assets = await assetsService.fetch(MOCK_SOLANA_KEYRING_ACCOUNT_0);

      expect(assets).toStrictEqual([MOCK_ASSET_ENTITY_0]);
    });
  });

  describe('save', () => {
    it('saves an asset', async () => {
      const spy = jest
        .spyOn(assetsService, 'saveMany')
        .mockResolvedValueOnce(undefined);

      await assetsService.save(MOCK_ASSET_ENTITY_0);

      expect(spy).toHaveBeenCalledWith([MOCK_ASSET_ENTITY_0]);
    });
  });

  describe('saveMany', () => {
    it('delegates to repository for saving assets', async () => {
      const saveManySpy = jest
        .spyOn(mockAssetsRepository, 'saveMany')
        .mockResolvedValue(undefined);

      jest.spyOn(mockAssetsRepository, 'getAll').mockResolvedValueOnce([]);

      await assetsService.saveMany(MOCK_ASSET_ENTITIES);

      expect(saveManySpy).toHaveBeenCalledWith(MOCK_ASSET_ENTITIES);
    });

    it('emits event "AccountAssetListUpdated" with ALL assets in added list, and removed assets in removed list', async () => {
      jest.spyOn(mockAssetsRepository, 'getAll').mockResolvedValueOnce([]);

      const addedAssets = [MOCK_ASSET_ENTITY_0, MOCK_ASSET_ENTITY_1];
      const removedAssets = [
        {
          ...MOCK_ASSET_ENTITY_2,
          rawAmount: '0',
        },
      ];

      await assetsService.saveMany([...addedAssets, ...removedAssets]);

      expect(emitSnapKeyringEvent).toHaveBeenNthCalledWith(
        1,
        snap,
        KeyringEvent.AccountAssetListUpdated,
        {
          assets: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              added: [
                MOCK_ASSET_ENTITY_0.assetType,
                MOCK_ASSET_ENTITY_1.assetType,
              ],
              removed: [MOCK_ASSET_ENTITY_2.assetType],
            },
          },
        },
      );
    });

    it('emits event "AccountAssetListUpdated" when an asset was saved with a zero balance and some more is added', async () => {
      jest
        .spyOn(mockAssetsRepository, 'getAll')
        .mockResolvedValueOnce([{ ...MOCK_ASSET_ENTITY_0, rawAmount: '0' }])
        .mockResolvedValueOnce([{ ...MOCK_ASSET_ENTITY_0, rawAmount: '0' }]);

      await assetsService.saveMany([
        { ...MOCK_ASSET_ENTITY_0, rawAmount: '0' },
      ]);

      await assetsService.saveMany([
        { ...MOCK_ASSET_ENTITY_0, rawAmount: '1000000' },
      ]);

      expect(emitSnapKeyringEvent).toHaveBeenCalledWith(
        snap,
        KeyringEvent.AccountAssetListUpdated,
        {
          assets: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              added: [MOCK_ASSET_ENTITY_0.assetType],
              removed: [],
            },
          },
        },
      );
    });

    it('emits event "AccountBalancesUpdated" when balances change', async () => {
      jest.spyOn(mockAssetsRepository, 'getAll').mockResolvedValueOnce([]);

      await assetsService.saveMany(MOCK_ASSET_ENTITIES);

      expect(emitSnapKeyringEvent).toHaveBeenNthCalledWith(
        2,
        snap,
        KeyringEvent.AccountBalancesUpdated,
        {
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              [MOCK_ASSET_ENTITY_0.assetType]: {
                unit: MOCK_ASSET_ENTITY_0.symbol,
                amount: MOCK_ASSET_ENTITY_0.uiAmount,
              },
              [MOCK_ASSET_ENTITY_1.assetType]: {
                unit: MOCK_ASSET_ENTITY_1.symbol,
                amount: MOCK_ASSET_ENTITY_1.uiAmount,
              },
              [MOCK_ASSET_ENTITY_2.assetType]: {
                unit: MOCK_ASSET_ENTITY_2.symbol,
                amount: MOCK_ASSET_ENTITY_2.uiAmount,
              },
            },
          },
        },
      );
    });

    it('emits event "AccountBalancesUpdated" when native balance goes from non-zero to zero', async () => {
      jest
        .spyOn(mockAssetsRepository, 'getAll')
        .mockResolvedValue([{ ...MOCK_ASSET_ENTITY_0, uiAmount: '1234' }]);

      await assetsService.saveMany([{ ...MOCK_ASSET_ENTITY_0, uiAmount: '0' }]);

      expect(emitSnapKeyringEvent).toHaveBeenCalledWith(
        snap,
        KeyringEvent.AccountBalancesUpdated,
        {
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              [MOCK_ASSET_ENTITY_0.assetType]: {
                unit: MOCK_ASSET_ENTITY_0.symbol,
                amount: '0',
              },
            },
          },
        },
      );
    });

    // With isIncremental = false, we do emit events, even when no assets changed
    it.skip('does not emit events when no assets changed', async () => {
      jest
        .spyOn(mockAssetsRepository, 'getAll')
        .mockResolvedValue(MOCK_ASSET_ENTITIES);

      await assetsService.saveMany(MOCK_ASSET_ENTITIES);
      (emitSnapKeyringEvent as jest.Mock).mockClear();

      await assetsService.saveMany(MOCK_ASSET_ENTITIES);

      expect(emitSnapKeyringEvent).not.toHaveBeenCalled();
    });

    it('fetches saved assets before saving new assets to ensure correct change detection', async () => {
      const callOrder: string[] = [];

      const getAllSpy = jest
        .spyOn(mockAssetsRepository, 'getAll')
        .mockImplementation(async () => {
          callOrder.push('getAll');
          return [];
        });

      const saveManySpy = jest
        .spyOn(mockAssetsRepository, 'saveMany')
        .mockImplementation(async () => {
          callOrder.push('saveMany');
        });

      await assetsService.saveMany(MOCK_ASSET_ENTITIES);

      // Verify that getAll was called before saveMany
      expect(callOrder).toStrictEqual(['getAll', 'saveMany']);
      expect(getAllSpy).toHaveBeenCalledTimes(1);
      expect(saveManySpy).toHaveBeenCalledTimes(1);
    });

    it('correctly detects new assets when savedAssets is fetched before saving', async () => {
      // Start with empty state
      jest.spyOn(mockAssetsRepository, 'getAll').mockResolvedValueOnce([]);

      await assetsService.saveMany([MOCK_ASSET_ENTITY_0]);

      // Should emit AccountAssetListUpdated with the new asset
      expect(emitSnapKeyringEvent).toHaveBeenCalledWith(
        snap,
        KeyringEvent.AccountAssetListUpdated,
        {
          assets: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              added: [MOCK_ASSET_ENTITY_0.assetType],
              removed: [],
            },
          },
        },
      );
    });

    it('correctly detects assets going from zero to non-zero balance when savedAssets is fetched before saving', async () => {
      const assetWithZeroBalance = { ...MOCK_ASSET_ENTITY_0, rawAmount: '0' };
      const assetWithNonZeroBalance = {
        ...MOCK_ASSET_ENTITY_0,
        rawAmount: '1000000',
      };

      // First save with zero balance
      jest.spyOn(mockAssetsRepository, 'getAll').mockResolvedValueOnce([]);
      await assetsService.saveMany([assetWithZeroBalance]);

      (emitSnapKeyringEvent as jest.Mock).mockClear();

      // Then save with non-zero balance, but getAll should return the state before this save
      jest
        .spyOn(mockAssetsRepository, 'getAll')
        .mockResolvedValueOnce([assetWithZeroBalance]);
      await assetsService.saveMany([assetWithNonZeroBalance]);

      // Should emit AccountAssetListUpdated because asset went from zero to non-zero
      expect(emitSnapKeyringEvent).toHaveBeenCalledWith(
        snap,
        KeyringEvent.AccountAssetListUpdated,
        {
          assets: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              added: [MOCK_ASSET_ENTITY_0.assetType],
              removed: [],
            },
          },
        },
      );
    });

    // With isIncremental = false, we do emit events, even when no assets changed
    it.skip('does not incorrectly mark assets as new when they are already in the saved state', async () => {
      // Mock that the asset already exists in saved state
      jest
        .spyOn(mockAssetsRepository, 'getAll')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_0]);

      await assetsService.saveMany([MOCK_ASSET_ENTITY_0]);

      // Should not emit AccountAssetListUpdated since no assets were actually added/removed
      expect(emitSnapKeyringEvent).not.toHaveBeenCalledWith(
        snap,
        KeyringEvent.AccountAssetListUpdated,
        expect.any(Object),
      );
    });

    it('correctly identifies balance changes when savedAssets reflects pre-save state', async () => {
      const originalAsset = { ...MOCK_ASSET_ENTITY_0, rawAmount: '1000000' };
      const updatedAsset = {
        ...MOCK_ASSET_ENTITY_0,
        rawAmount: '2000000',
        uiAmount: '2.0',
      };

      // Mock that original asset exists in saved state
      jest
        .spyOn(mockAssetsRepository, 'getAll')
        .mockResolvedValueOnce([originalAsset]);

      await assetsService.saveMany([updatedAsset]);

      // Should emit AccountBalancesUpdated because balance changed
      expect(emitSnapKeyringEvent).toHaveBeenCalledWith(
        snap,
        KeyringEvent.AccountBalancesUpdated,
        {
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              [MOCK_ASSET_ENTITY_0.assetType]: {
                unit: updatedAsset.symbol,
                amount: updatedAsset.uiAmount,
              },
            },
          },
        },
      );
    });

    it('does not include native assets in removed array even when they have zero balance', async () => {
      const nativeAssetWithZeroBalance = {
        ...MOCK_ASSET_ENTITY_0,
        rawAmount: '0',
      };
      const tokenAssetWithZeroBalance = {
        ...MOCK_ASSET_ENTITY_1,
        rawAmount: '0',
      };

      // Mock that both assets existed with non-zero balance
      jest.spyOn(mockAssetsRepository, 'getAll').mockResolvedValueOnce([
        MOCK_ASSET_ENTITY_0, // Native asset with non-zero balance
        MOCK_ASSET_ENTITY_1, // Token asset with non-zero balance
      ]);

      await assetsService.saveMany([
        nativeAssetWithZeroBalance,
        tokenAssetWithZeroBalance,
      ]);

      // Should emit AccountAssetListUpdated with only the token asset in the removed array
      expect(emitSnapKeyringEvent).toHaveBeenCalledWith(
        snap,
        KeyringEvent.AccountAssetListUpdated,
        {
          assets: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              added: [MOCK_ASSET_ENTITY_0.assetType],
              removed: [MOCK_ASSET_ENTITY_1.assetType], // Only token asset, not native
            },
          },
        },
      );
    });
  });

  describe('hasChanged', () => {
    it('returns true if the raw amount has changed', () => {
      const asset = cloneDeep(MOCK_ASSET_ENTITY_0);
      asset.rawAmount = '123';
      const assetsLookup = [MOCK_ASSET_ENTITY_0];

      expect(AssetsService.hasChanged(asset, assetsLookup)).toBe(true);
    });

    it('returns true if the ui amount has changed', () => {
      const asset = cloneDeep(MOCK_ASSET_ENTITY_0);
      asset.uiAmount = '123';
      const assetsLookup = [MOCK_ASSET_ENTITY_0];

      expect(AssetsService.hasChanged(asset, assetsLookup)).toBe(true);
    });

    it('returns true if the asset does not exist in the lookup', () => {
      const asset = cloneDeep(MOCK_ASSET_ENTITY_0);
      const assetsLookup = [MOCK_ASSET_ENTITY_1, MOCK_ASSET_ENTITY_2];

      expect(AssetsService.hasChanged(asset, assetsLookup)).toBe(true);
    });

    it('returns false if the asset has not changed', () => {
      const asset = cloneDeep(MOCK_ASSET_ENTITY_0);
      const assetsLookup = [MOCK_ASSET_ENTITY_0];

      expect(AssetsService.hasChanged(asset, assetsLookup)).toBe(false);
    });
  });

  describe('getAll', () => {
    it('delegates to repository and returns all assets', async () => {
      jest
        .spyOn(mockAssetsRepository, 'getAll')
        .mockResolvedValueOnce(MOCK_ASSET_ENTITIES);

      const assets = await assetsService.getAll();

      expect(assets).toStrictEqual(MOCK_ASSET_ENTITIES);
    });
  });

  describe('findByAccount', () => {
    it('returns saved assets for the account when they exist', async () => {
      jest
        .spyOn(mockAssetsRepository, 'findByKeyringAccountId')
        .mockResolvedValueOnce(MOCK_ASSET_ENTITIES);

      const assets = await assetsService.findByAccount(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
      );

      expect(assets).toStrictEqual(MOCK_ASSET_ENTITIES);
    });

    it('includes placeholder native assets when no assets exist', async () => {
      jest
        .spyOn(mockAssetsRepository, 'findByKeyringAccountId')
        .mockResolvedValueOnce([]);

      const assets = await assetsService.findByAccount(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
      );

      expect(assets).toStrictEqual([
        {
          assetType: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
          network: Network.Mainnet,
          address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
          symbol: 'SOL',
          decimals: 9,
          rawAmount: '0',
          uiAmount: '0',
        },
      ]);
    });

    it('includes placeholder native assets with zero balance when no native assets exist', async () => {
      const nonNativeAssets = [MOCK_ASSET_ENTITY_1, MOCK_ASSET_ENTITY_2]; // Token assets only

      jest
        .spyOn(mockAssetsRepository, 'findByKeyringAccountId')
        .mockResolvedValueOnce(nonNativeAssets);

      const assets = await assetsService.findByAccount(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
      );

      // Should include the saved assets plus a placeholder native asset
      expect(assets).toHaveLength(nonNativeAssets.length + 1);
      expect(assets).toStrictEqual(
        expect.arrayContaining([
          ...nonNativeAssets,
          {
            assetType: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
            network: Network.Mainnet,
            address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
            symbol: 'SOL',
            decimals: 9,
            rawAmount: '0',
            uiAmount: '0',
          },
        ]),
      );
    });

    it('does not add placeholder native assets when they already exist', async () => {
      jest
        .spyOn(mockAssetsRepository, 'findByKeyringAccountId')
        .mockResolvedValueOnce(MOCK_ASSET_ENTITIES); // Includes native asset (MOCK_ASSET_ENTITY_0)

      const assets = await assetsService.findByAccount(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
      );

      expect(assets).toStrictEqual(MOCK_ASSET_ENTITIES);
    });
  });

  describe('getAccountAssetByID', () => {
    it('routes fungible assets through CoreAssetsAdapter', async () => {
      jest.spyOn(mockCoreAssetsAdapter, 'getAccountAsset').mockResolvedValueOnce(
        MOCK_ASSET_ENTITY_1,
      );

      const asset = await assetsService.getAccountAssetByID(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        MOCK_ASSET_ENTITY_1.assetType,
      );

      expect(mockCoreAssetsAdapter.getAccountAsset).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        MOCK_ASSET_ENTITY_1.assetType,
        MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
      );
      expect(asset).toStrictEqual(MOCK_ASSET_ENTITY_1);
    });

    it('routes NFT assets through SnapAssetsAdapter', async () => {
      const nftAssetType =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/nft:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const snapSpy = jest
        .spyOn(snapAssetsAdapter, 'getAccountAssetByID')
        .mockResolvedValueOnce(null);

      await assetsService.getAccountAssetByID(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        nftAssetType,
      );

      expect(snapSpy).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        nftAssetType,
      );
      expect(mockCoreAssetsAdapter.getAccountAsset).not.toHaveBeenCalled();
    });

    it('returns null when the fungible asset is missing from Core', async () => {
      jest.spyOn(mockCoreAssetsAdapter, 'getAccountAsset').mockResolvedValueOnce(
        null,
      );

      const asset = await assetsService.getAccountAssetByID(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        MOCK_ASSET_ENTITY_1.assetType,
      );

      expect(asset).toBeNull();
    });
  });

  describe('getAccountAssetsByIDs', () => {
    it('routes fungible and NFT asset IDs to the correct adapters', async () => {
      const nftAssetType =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/nft:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

      jest
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssetsByIds')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_0]);
      jest.spyOn(snapAssetsAdapter, 'getAccountAssetsByIDs').mockResolvedValueOnce(
        {
          [nftAssetType]: null,
        },
      );

      const assets = await assetsService.getAccountAssetsByIDs(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        [MOCK_ASSET_ENTITY_0.assetType, nftAssetType],
      );

      expect(mockCoreAssetsAdapter.getAccountAssetsByIds).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        [MOCK_ASSET_ENTITY_0.assetType],
        MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
        [Network.Mainnet],
      );
      expect(snapAssetsAdapter.getAccountAssetsByIDs).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        [nftAssetType],
      );
      expect(assets).toStrictEqual({
        [MOCK_ASSET_ENTITY_0.assetType]: MOCK_ASSET_ENTITY_0,
        [nftAssetType]: null,
      });
    });
  });

  describe('getAccountAssetsByScope', () => {
    it('merges fungible Core assets with Snap-owned NFT assets for the scope', async () => {
      const nftAssetType =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/nft:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const nftAsset = {
        assetType: nftAssetType,
        keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        network: Network.Mainnet,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        pubkey: '9wt9PfjPD3JCy5r7o4K1cTGiuTG7fq2pQhdDCdQALKjg',
        symbol: 'NFT',
        decimals: 0,
        rawAmount: '1',
        uiAmount: '1',
      } as AssetEntity;

      jest
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssets')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_0, MOCK_ASSET_ENTITY_1]);
      jest.spyOn(snapAssetsAdapter, 'getAccountAssetsByScope').mockResolvedValueOnce(
        [MOCK_ASSET_ENTITY_2, nftAsset],
      );

      const assets = await assetsService.getAccountAssetsByScope(
        Network.Mainnet,
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(mockCoreAssetsAdapter.getAccountAssets).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
        [Network.Mainnet],
      );
      expect(assets).toStrictEqual([
        MOCK_ASSET_ENTITY_0,
        MOCK_ASSET_ENTITY_1,
        nftAsset,
      ]);
    });
  });

  describe('getAccountAssetsForAllActiveScopes', () => {
    it('merges fungible Core assets with Snap-owned NFT assets across active scopes', async () => {
      const nftAssetType =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/nft:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const nftAsset = {
        assetType: nftAssetType,
        keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        network: Network.Mainnet,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        pubkey: '9wt9PfjPD3JCy5r7o4K1cTGiuTG7fq2pQhdDCdQALKjg',
        symbol: 'NFT',
        decimals: 0,
        rawAmount: '1',
        uiAmount: '1',
      } as AssetEntity;

      jest
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssets')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_0]);
      jest
        .spyOn(snapAssetsAdapter, 'getAccountAssetsForAllActiveScopes')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_1, nftAsset]);

      const assets = await assetsService.getAccountAssetsForAllActiveScopes(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(mockCoreAssetsAdapter.getAccountAssets).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
        [Network.Mainnet],
      );
      expect(assets).toStrictEqual([MOCK_ASSET_ENTITY_0, nftAsset]);
    });
  });
});
