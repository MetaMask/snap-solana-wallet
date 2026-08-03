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
import type { TokenPricesService } from '../token-prices/TokenPrices';
import type { CoreAssetsAdapter } from './adapters/CoreAssetsAdapter';
import { SnapAssetsAdapter } from './adapters/SnapAssetsAdapter';
import type { AssetsRepository } from './AssetsRepository';
import { AssetsService } from './AssetsService';

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
      getAccountAssetByID: jest.fn(),
      getAccountAssetsByScope: jest.fn(),
      getAccountAssetsByIDs: jest.fn(),
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
    it('returns an empty array because Snap fungible tracking is disabled', async () => {
      const fetchSpy = jest.spyOn(snapAssetsAdapter, 'fetch');

      const assets = await assetsService.fetch(MOCK_SOLANA_KEYRING_ACCOUNT_0);

      expect(assets).toStrictEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('is a no-op because Snap fungible tracking is disabled', async () => {
      const saveManySpy = jest.spyOn(mockAssetsRepository, 'saveMany');

      await assetsService.save(MOCK_ASSET_ENTITY_0);

      expect(saveManySpy).not.toHaveBeenCalled();
    });
  });

  describe('saveMany', () => {
    it('is a no-op because Snap fungible tracking is disabled', async () => {
      const saveManySpy = jest.spyOn(mockAssetsRepository, 'saveMany');

      await assetsService.saveMany(MOCK_ASSET_ENTITIES);

      expect(saveManySpy).not.toHaveBeenCalled();
      expect(emitSnapKeyringEvent).not.toHaveBeenCalled();
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
      jest
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssetByID')
        .mockResolvedValueOnce(MOCK_ASSET_ENTITY_1);

      const asset = await assetsService.getAccountAssetByID(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        MOCK_ASSET_ENTITY_1.assetType,
      );

      expect(mockCoreAssetsAdapter.getAccountAssetByID).toHaveBeenCalledWith(
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
      expect(mockCoreAssetsAdapter.getAccountAssetByID).not.toHaveBeenCalled();
    });

    it('returns null when the fungible asset is missing from Core', async () => {
      jest
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssetByID')
        .mockResolvedValueOnce(null);

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
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssetsByIDs')
        .mockResolvedValueOnce({
          [MOCK_ASSET_ENTITY_0.assetType]: MOCK_ASSET_ENTITY_0,
        });
      jest
        .spyOn(snapAssetsAdapter, 'getAccountAssetsByIDs')
        .mockResolvedValueOnce({
          [nftAssetType]: null,
        });

      const assets = await assetsService.getAccountAssetsByIDs(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        [MOCK_ASSET_ENTITY_0.assetType, nftAssetType],
      );

      expect(mockCoreAssetsAdapter.getAccountAssetsByIDs).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        [MOCK_ASSET_ENTITY_0.assetType],
        MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
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
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssetsByScope')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_0, MOCK_ASSET_ENTITY_1]);
      jest
        .spyOn(snapAssetsAdapter, 'getAccountAssetsByScope')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_2, nftAsset]);

      const assets = await assetsService.getAccountAssetsByScope(
        Network.Mainnet,
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(
        mockCoreAssetsAdapter.getAccountAssetsByScope,
      ).toHaveBeenCalledWith(
        Network.Mainnet,
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
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
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssetsByScope')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_0]);
      jest
        .spyOn(snapAssetsAdapter, 'getAccountAssetsForAllActiveScopes')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_1, nftAsset]);

      const assets = await assetsService.getAccountAssetsForAllActiveScopes(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(
        mockCoreAssetsAdapter.getAccountAssetsByScope,
      ).toHaveBeenCalledWith(
        Network.Mainnet,
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
      );
      expect(assets).toStrictEqual([MOCK_ASSET_ENTITY_0, nftAsset]);
    });
  });
});
