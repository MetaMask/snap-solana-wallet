import type { NftApiClient } from '../../clients/nft-api/NftApiClient';
import type { TokenApiClient } from '../../clients/token-api-client/TokenApiClient';
import { KnownCaip19Id, Network } from '../../constants/solana';
import {
  MOCK_ASSET_ENTITY_0,
  MOCK_ASSET_ENTITY_1,
  MOCK_ASSET_ENTITIES,
  SOLANA_MOCK_TOKEN_METADATA,
} from '../../test/mocks/asset-entities';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import type { AccountsService } from '../accounts/AccountsService';
import type { ConfigProvider } from '../config';
import { mockLogger } from '../mocks/logger';
import type { TokenPricesService } from '../token-prices/TokenPrices';
import type { CoreAssetsAdapter } from './CoreAssetsAdapter';
import { AssetsService } from './AssetsService';

describe('AssetsService', () => {
  let assetsService: AssetsService;
  let mockCoreAssetsAdapter: CoreAssetsAdapter;
  let mockAccountsService: AccountsService;
  let mockConfigProvider: ConfigProvider;
  let mockTokenApiClient: TokenApiClient;
  let mockTokenPricesService: TokenPricesService;
  let mockNftApiClient: NftApiClient;

  const accountId = MOCK_SOLANA_KEYRING_ACCOUNT_0.id;
  const accountAddress = MOCK_SOLANA_KEYRING_ACCOUNT_0.address;
  const chainIds = [Network.Mainnet];

  beforeEach(() => {
    jest.clearAllMocks();

    mockCoreAssetsAdapter = {
      getAccountAsset: jest.fn(),
      getAccountAssets: jest.fn(),
      getAccountAssetsByIds: jest.fn(),
    } as unknown as CoreAssetsAdapter;

    mockAccountsService = {
      findById: jest.fn().mockResolvedValue(MOCK_SOLANA_KEYRING_ACCOUNT_0),
    } as unknown as AccountsService;

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        staticApi: { baseUrl: 'https://static.example.com' },
      }),
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
    it('returns null when account is missing', async () => {
      jest.spyOn(mockAccountsService, 'findById').mockResolvedValueOnce(null);

      const result = await assetsService.getAccountAssetByID(
        accountId,
        KnownCaip19Id.SolMainnet,
      );

      expect(result).toBeNull();
      expect(mockCoreAssetsAdapter.getAccountAsset).not.toHaveBeenCalled();
    });

    it('forwards to CoreAssetsAdapter with account address', async () => {
      jest
        .spyOn(mockCoreAssetsAdapter, 'getAccountAsset')
        .mockResolvedValueOnce(MOCK_ASSET_ENTITY_0);

      const result = await assetsService.getAccountAssetByID(
        accountId,
        KnownCaip19Id.SolMainnet,
      );

      expect(mockCoreAssetsAdapter.getAccountAsset).toHaveBeenCalledWith(
        accountId,
        KnownCaip19Id.SolMainnet,
        accountAddress,
      );
      expect(result).toStrictEqual(MOCK_ASSET_ENTITY_0);
    });
  });

  describe('getAccountAssets', () => {
    it('returns empty array when account is missing', async () => {
      jest.spyOn(mockAccountsService, 'findById').mockResolvedValueOnce(null);

      const result = await assetsService.getAccountAssets(accountId);

      expect(result).toStrictEqual([]);
      expect(mockCoreAssetsAdapter.getAccountAssets).not.toHaveBeenCalled();
    });

    it('forwards to CoreAssetsAdapter with address and active chain IDs', async () => {
      jest
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssets')
        .mockResolvedValueOnce(MOCK_ASSET_ENTITIES);

      const result = await assetsService.getAccountAssets(accountId);

      expect(mockConfigProvider.getActiveNetworks).toHaveBeenCalled();
      expect(mockCoreAssetsAdapter.getAccountAssets).toHaveBeenCalledWith(
        accountId,
        accountAddress,
        chainIds,
      );
      expect(result).toStrictEqual(MOCK_ASSET_ENTITIES);
    });
  });

  describe('getAccountAssetsByIDs', () => {
    const assetIds = [
      KnownCaip19Id.SolMainnet,
      KnownCaip19Id.UsdcMainnet,
    ];

    it('returns all nulls when account is missing', async () => {
      jest.spyOn(mockAccountsService, 'findById').mockResolvedValueOnce(null);

      const result = await assetsService.getAccountAssetsByIDs(
        accountId,
        assetIds,
      );

      expect(result).toStrictEqual([null, null]);
      expect(mockCoreAssetsAdapter.getAccountAssetsByIds).not.toHaveBeenCalled();
    });

    it('forwards to CoreAssetsAdapter with address and active chain IDs', async () => {
      jest
        .spyOn(mockCoreAssetsAdapter, 'getAccountAssetsByIds')
        .mockResolvedValueOnce([MOCK_ASSET_ENTITY_0, MOCK_ASSET_ENTITY_1]);

      const result = await assetsService.getAccountAssetsByIDs(
        accountId,
        assetIds,
      );

      expect(mockConfigProvider.getActiveNetworks).toHaveBeenCalled();
      expect(mockCoreAssetsAdapter.getAccountAssetsByIds).toHaveBeenCalledWith(
        accountId,
        assetIds,
        accountAddress,
        chainIds,
      );
      expect(result).toStrictEqual([
        MOCK_ASSET_ENTITY_0,
        MOCK_ASSET_ENTITY_1,
      ]);
    });
  });

  describe('getAssetsMetadata', () => {
    it('fetches native and token metadata', async () => {
      const assetTypes = [KnownCaip19Id.SolMainnet, KnownCaip19Id.UsdcMainnet];

      const result = await assetsService.getAssetsMetadata(assetTypes);

      expect(mockTokenApiClient.getTokensMetadata).toHaveBeenCalledWith([
        KnownCaip19Id.UsdcMainnet,
      ]);
      expect(result[KnownCaip19Id.SolMainnet]).toMatchObject({
        name: 'Solana',
        symbol: 'SOL',
        fungible: true,
      });
      expect(result[KnownCaip19Id.UsdcMainnet]).toStrictEqual(
        SOLANA_MOCK_TOKEN_METADATA[KnownCaip19Id.UsdcMainnet],
      );
    });
  });

  describe('fetchAssetsMarketData', () => {
    it('delegates to TokenPricesService', async () => {
      const assets = [
        {
          asset: KnownCaip19Id.SolMainnet,
          unit: KnownCaip19Id.UsdcMainnet,
        },
      ];
      const marketData = {
        [KnownCaip19Id.SolMainnet]: {
          [KnownCaip19Id.UsdcMainnet]: { price: 1 },
        },
      };
      jest
        .spyOn(mockTokenPricesService, 'getMultipleTokensMarketData')
        .mockResolvedValueOnce(marketData as never);

      const result = await assetsService.fetchAssetsMarketData(assets);

      expect(
        mockTokenPricesService.getMultipleTokensMarketData,
      ).toHaveBeenCalledWith(assets);
      expect(result).toStrictEqual(marketData);
    });
  });
});
