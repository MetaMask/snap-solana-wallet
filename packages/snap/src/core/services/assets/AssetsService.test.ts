/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import { cloneDeep } from 'lodash';

import type { ICache } from '../../caching/ICache';
import { InMemoryCache } from '../../caching/InMemoryCache';
import { MOCK_NFTS_LIST_RESPONSE_MAPPED } from '../../clients/nft-api/mocks/mockNftsListResponseMapped';
import type { NftApiClient } from '../../clients/nft-api/NftApiClient';
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
import type { ConfigProvider } from '../config';
import type { SolanaConnection } from '../connection';
import { mockLogger } from '../mocks/logger';
import { createMockConnection } from '../mocks/mockConnection';
import { MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE } from '../mocks/mockSolanaRpcResponses';
import { InMemoryState } from '../state/InMemoryState';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';
import { DEFAULT_UNENCRYPTED_STATE } from '../state/State';
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
  let mockNftApiClient: NftApiClient;
  let mockState: IStateManager<UnencryptedStateValue>;
  let stateSetKeySpy: jest.SpyInstance;
  let mockCache: ICache<Serializable>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = createMockConnection();

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        activeNetworks: [Network.Mainnet],
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

    mockNftApiClient = {
      listAddressSolanaNfts: jest
        .fn()
        .mockResolvedValue(MOCK_NFTS_LIST_RESPONSE_MAPPED.items),
    } as unknown as NftApiClient;

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
    it('saves multiple assets', async () => {
      await assetsService.saveMany(MOCK_ASSET_ENTITIES);

      const savedAssets = await mockState.getKey('assetEntities');
      expect(savedAssets).toStrictEqual({
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: MOCK_ASSET_ENTITIES,
      });
    });

    it('overrides existing assets with the same assetType', async () => {
      await assetsService.saveMany([MOCK_ASSET_ENTITY_1]);

      const updatedAsset = {
        ...MOCK_ASSET_ENTITY_1,
        rawAmount: '123',
        uiAmount: '123',
      };

      await assetsService.saveMany([updatedAsset]);

      const savedAssets = await mockState.getKey('assetEntities');
      expect(savedAssets).toStrictEqual({
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: [updatedAsset],
      });
    });

    it('emits event "AccountAssetListUpdated" when new assets are added and removed', async () => {
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

    it('emits event "AccountAssetListUpdated" when an asset was saved with a zero balance some more is added', async () => {
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

    it('does not emit events when no assets changed', async () => {
      await assetsService.saveMany(MOCK_ASSET_ENTITIES);
      (emitSnapKeyringEvent as jest.Mock).mockClear();

      await assetsService.saveMany(MOCK_ASSET_ENTITIES);

      expect(emitSnapKeyringEvent).not.toHaveBeenCalled();
    });
  });

  describe('hasChanged', () => {
    it('returns true if the asset has changed', () => {
      const asset = cloneDeep(MOCK_ASSET_ENTITY_0);
      asset.rawAmount = '123';
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
    it('returns all assets', async () => {
      jest.spyOn(mockState, 'getKey').mockResolvedValueOnce({
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: MOCK_ASSET_ENTITIES,
      });

      const assets = await assetsService.getAll();

      expect(assets).toStrictEqual(MOCK_ASSET_ENTITIES);
    });
  });

  describe('getByAccount', () => {
    it('returns all assets for the account', async () => {
      jest
        .spyOn(mockState, 'getKey')
        .mockResolvedValueOnce(MOCK_ASSET_ENTITIES);

      const assets = await assetsService.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(assets).toStrictEqual(MOCK_ASSET_ENTITIES);
    });
  });
});
