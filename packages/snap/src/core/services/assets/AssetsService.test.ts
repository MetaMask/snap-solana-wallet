import type { NftApiClient } from '../../clients/nft-api/NftApiClient';
import type { TokenApiClient } from '../../clients/token-api-client/TokenApiClient';
import { Network } from '../../constants/solana';
import {
  MOCK_ASSET_ENTITY_0,
  MOCK_ASSET_ENTITY_1,
  SOLANA_MOCK_TOKEN_METADATA,
} from '../../test/mocks/asset-entities';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import type { AccountsService } from '../accounts/AccountsService';
import type { ConfigProvider } from '../config';
import { mockLogger } from '../mocks/logger';
import type { TokenPricesService } from '../token-prices/TokenPrices';
import type { CoreAssetsAdapter } from './adapters/CoreAssetsAdapter';
import { AssetsService } from './AssetsService';

describe('AssetsService', () => {
  let assetsService: AssetsService;
  let mockConfigProvider: ConfigProvider;
  let mockAccountsService: AccountsService;
  let mockTokenApiClient: TokenApiClient;
  let mockTokenPricesService: TokenPricesService;
  let mockNftApiClient: NftApiClient;
  let mockCoreAssetsAdapter: CoreAssetsAdapter;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigProvider = {
      getActiveNetworks: jest.fn().mockResolvedValue([Network.Mainnet]),
    } as unknown as ConfigProvider;

    mockTokenApiClient = {
      getTokensMetadata: jest
        .fn()
        .mockResolvedValue(SOLANA_MOCK_TOKEN_METADATA),
    } as unknown as TokenApiClient;

    mockTokenPricesService = {
      getMultipleTokensMarketData: jest.fn().mockResolvedValue({}),
    } as unknown as TokenPricesService;

    mockNftApiClient = {} as unknown as NftApiClient;

    mockAccountsService = {
      findById: jest.fn().mockResolvedValue(MOCK_SOLANA_KEYRING_ACCOUNT_0),
    } as unknown as AccountsService;

    mockCoreAssetsAdapter = {
      getAccountAssetByID: jest.fn(),
      getAccountAssetsByScope: jest.fn(),
      getAccountAssetsByIDs: jest.fn(),
    } as unknown as CoreAssetsAdapter;

    assetsService = new AssetsService({
      logger: mockLogger,
      configProvider: mockConfigProvider,
      coreAssetsAdapter: mockCoreAssetsAdapter,
      accountsService: mockAccountsService,
      tokenApiClient: mockTokenApiClient,
      tokenPricesService: mockTokenPricesService,
      nftApiClient: mockNftApiClient,
    });
  });

  describe('getAccountAssetByID', () => {
    it('routes reads through CoreAssetsAdapter', async () => {
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
  });

  describe('getAccountAssetsByIDs', () => {
    it('returns keyed results from CoreAssetsAdapter', async () => {
      jest
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssetsByIDs')
        .mockResolvedValueOnce({
          [MOCK_ASSET_ENTITY_0.assetType]: MOCK_ASSET_ENTITY_0,
        });

      const assets = await assetsService.getAccountAssetsByIDs(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        [MOCK_ASSET_ENTITY_0.assetType],
      );

      expect(mockCoreAssetsAdapter.getAccountAssetsByIDs).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        [MOCK_ASSET_ENTITY_0.assetType],
        MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
      );
      expect(assets).toStrictEqual({
        [MOCK_ASSET_ENTITY_0.assetType]: MOCK_ASSET_ENTITY_0,
      });
    });
  });

  describe('getAccountAssetsByScope', () => {
    it('routes scope reads through CoreAssetsAdapter', async () => {
      jest
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssetsByScope')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_0, MOCK_ASSET_ENTITY_1]);

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
      expect(assets).toStrictEqual([MOCK_ASSET_ENTITY_0, MOCK_ASSET_ENTITY_1]);
    });
  });

  describe('getAccountAssetsForAllActiveScopes', () => {
    it('aggregates scope reads across active networks', async () => {
      jest
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssetsByScope')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_0]);

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
      expect(assets).toStrictEqual([MOCK_ASSET_ENTITY_0]);
    });
  });
});
