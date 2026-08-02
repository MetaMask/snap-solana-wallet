import { cloneDeep } from 'lodash';

import type { ICache } from '../../../caching/ICache';
import { InMemoryCache } from '../../../caching/InMemoryCache';
import { MOCK_NFTS_LIST_RESPONSE_MAPPED } from '../../../clients/nft-api/mocks/mockNftsListResponseMapped';
import type { NftApiClient } from '../../../clients/nft-api/NftApiClient';
import type { TokenApiClient } from '../../../clients/token-api-client/TokenApiClient';
import type { Serializable } from '../../../serialization/types';
import {
  MOCK_ASSET_ENTITY_0,
  MOCK_ASSET_ENTITY_1,
  MOCK_ASSET_ENTITY_2,
} from '../../../test/mocks/asset-entities';
import type { AccountsService } from '../../accounts/AccountsService';
import type { ConfigProvider } from '../../config';
import type { SolanaConnection } from '../../connection';
import { mockLogger } from '../../mocks/logger';
import { createMockConnection } from '../../mocks/mockConnection';
import type { AssetsRepository } from '../AssetsRepository';
import { SnapAssetsAdapter } from './SnapAssetsAdapter';

describe('SnapAssetsAdapter', () => {
  let snapAssetsAdapter: SnapAssetsAdapter;
  let mockConnection: SolanaConnection;
  let mockConfigProvider: ConfigProvider;
  let mockAssetsRepository: AssetsRepository;
  let mockAccountsService: AccountsService;
  let mockTokenApiClient: TokenApiClient;
  let mockNftApiClient: NftApiClient;
  let mockCache: ICache<Serializable>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = createMockConnection();

    mockConfigProvider = {
      getActiveNetworks: jest.fn().mockResolvedValue([]),
    } as unknown as ConfigProvider;

    mockTokenApiClient = {
      getTokensMetadata: jest.fn().mockResolvedValue({}),
    } as unknown as TokenApiClient;

    mockCache = new InMemoryCache(mockLogger);

    mockNftApiClient = {
      listAddressSolanaNfts: jest
        .fn()
        .mockResolvedValue(MOCK_NFTS_LIST_RESPONSE_MAPPED.items),
    } as unknown as NftApiClient;

    mockAssetsRepository = {
      findByKeyringAccountId: jest.fn(),
      getAll: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as AssetsRepository;

    mockAccountsService = {
      findById: jest.fn(),
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
  });

  describe('hasChanged', () => {
    it('returns true if the raw amount has changed', () => {
      const asset = cloneDeep(MOCK_ASSET_ENTITY_0);
      asset.rawAmount = '123';
      const assetsLookup = [MOCK_ASSET_ENTITY_0];

      expect(SnapAssetsAdapter.hasChanged(asset, assetsLookup)).toBe(true);
    });

    it('returns true if the ui amount has changed', () => {
      const asset = cloneDeep(MOCK_ASSET_ENTITY_0);
      asset.uiAmount = '123';
      const assetsLookup = [MOCK_ASSET_ENTITY_0];

      expect(SnapAssetsAdapter.hasChanged(asset, assetsLookup)).toBe(true);
    });

    it('returns true if the asset does not exist in the lookup', () => {
      const asset = cloneDeep(MOCK_ASSET_ENTITY_0);
      const assetsLookup = [MOCK_ASSET_ENTITY_1, MOCK_ASSET_ENTITY_2];

      expect(SnapAssetsAdapter.hasChanged(asset, assetsLookup)).toBe(true);
    });

    it('returns false if the asset has not changed', () => {
      const asset = cloneDeep(MOCK_ASSET_ENTITY_0);
      const assetsLookup = [MOCK_ASSET_ENTITY_0];

      expect(SnapAssetsAdapter.hasChanged(asset, assetsLookup)).toBe(false);
    });
  });
});
