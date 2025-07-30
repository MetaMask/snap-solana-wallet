import { cloneDeep } from 'lodash';

import {
  MOCK_ASSET_ENTITIES,
  MOCK_ASSET_ENTITY_0,
  MOCK_ASSET_ENTITY_1,
  MOCK_ASSET_ENTITY_2,
} from '../../test/mocks/asset-entities';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import { InMemoryState } from '../state/InMemoryState';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';
import { DEFAULT_UNENCRYPTED_STATE } from '../state/State';
import { AssetsRepository } from './AssetsRepository';

describe('AssetsRepository', () => {
  let repository: AssetsRepository;
  let mockState: IStateManager<UnencryptedStateValue>;

  beforeEach(() => {
    mockState = new InMemoryState(cloneDeep(DEFAULT_UNENCRYPTED_STATE));
    repository = new AssetsRepository(mockState);
  });

  describe('findByKeyringAccountId', () => {
    it('returns empty array when no assets exist for the account', async () => {
      const assets = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(assets).toStrictEqual([]);
    });

    it('returns assets for the specified account', async () => {
      await repository.saveMany([MOCK_ASSET_ENTITY_0, MOCK_ASSET_ENTITY_1]);

      const assets = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(assets).toStrictEqual([MOCK_ASSET_ENTITY_0, MOCK_ASSET_ENTITY_1]);
    });

    it('returns assets only for the requested account', async () => {
      const assetForAccount1 = {
        ...MOCK_ASSET_ENTITY_0,
        keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      };

      await repository.saveMany([
        MOCK_ASSET_ENTITY_0,
        MOCK_ASSET_ENTITY_1,
        assetForAccount1,
      ]);

      const assetsForAccount0 = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );
      const assetsForAccount1 = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      );

      expect(assetsForAccount0).toStrictEqual([
        MOCK_ASSET_ENTITY_0,
        MOCK_ASSET_ENTITY_1,
      ]);
      expect(assetsForAccount1).toStrictEqual([assetForAccount1]);
    });
  });

  describe('getAll', () => {
    it('returns empty array when no assets exist', async () => {
      const assets = await repository.getAll();

      expect(assets).toStrictEqual([]);
    });

    it('returns all assets from all accounts', async () => {
      const assetForAccount1 = {
        ...MOCK_ASSET_ENTITY_0,
        keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      };

      await repository.saveMany([
        MOCK_ASSET_ENTITY_0,
        MOCK_ASSET_ENTITY_1,
        assetForAccount1,
      ]);

      const assets = await repository.getAll();

      expect(assets).toStrictEqual([
        MOCK_ASSET_ENTITY_0,
        MOCK_ASSET_ENTITY_1,
        assetForAccount1,
      ]);
    });
  });

  describe('saveMany', () => {
    it('saves a single asset', async () => {
      await repository.saveMany([MOCK_ASSET_ENTITY_0]);

      const assets = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(assets).toStrictEqual([MOCK_ASSET_ENTITY_0]);
    });

    it('saves multiple assets', async () => {
      await repository.saveMany(MOCK_ASSET_ENTITIES);

      const assets = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(assets).toStrictEqual(MOCK_ASSET_ENTITIES);
    });

    it('saves assets for multiple accounts', async () => {
      const assetForAccount1 = {
        ...MOCK_ASSET_ENTITY_0,
        keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      };

      await repository.saveMany([MOCK_ASSET_ENTITY_0, assetForAccount1]);

      const assetsForAccount0 = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );
      const assetsForAccount1 = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      );

      expect(assetsForAccount0).toStrictEqual([MOCK_ASSET_ENTITY_0]);
      expect(assetsForAccount1).toStrictEqual([assetForAccount1]);
    });

    it('overrides existing assets with the same assetType and keyringAccountId', async () => {
      await repository.saveMany([MOCK_ASSET_ENTITY_1]);

      const updatedAsset = {
        ...MOCK_ASSET_ENTITY_1,
        rawAmount: '999999999',
        uiAmount: '999.999999',
      };

      await repository.saveMany([updatedAsset]);

      const assets = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(assets).toStrictEqual([updatedAsset]);
    });

    it('adds new asset when assetType differs', async () => {
      await repository.saveMany([MOCK_ASSET_ENTITY_0]);

      await repository.saveMany([MOCK_ASSET_ENTITY_1]);

      const assets = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(assets).toStrictEqual([MOCK_ASSET_ENTITY_0, MOCK_ASSET_ENTITY_1]);
    });

    it('maintains existing assets when adding new ones', async () => {
      await repository.saveMany([MOCK_ASSET_ENTITY_0, MOCK_ASSET_ENTITY_1]);

      await repository.saveMany([MOCK_ASSET_ENTITY_2]);

      const assets = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(assets).toStrictEqual([
        MOCK_ASSET_ENTITY_0,
        MOCK_ASSET_ENTITY_1,
        MOCK_ASSET_ENTITY_2,
      ]);
    });

    it('updates state atomically for multiple assets', async () => {
      const updatedAsset0 = {
        ...MOCK_ASSET_ENTITY_0,
        rawAmount: '777777777',
        uiAmount: '0.777777777',
      };
      const updatedAsset1 = {
        ...MOCK_ASSET_ENTITY_1,
        rawAmount: '888888888',
        uiAmount: '888.888888',
      };

      await repository.saveMany([MOCK_ASSET_ENTITY_0, MOCK_ASSET_ENTITY_1]);

      await repository.saveMany([updatedAsset0, updatedAsset1]);

      const assets = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(assets).toStrictEqual([updatedAsset0, updatedAsset1]);
    });

    it('handles empty array input', async () => {
      await repository.saveMany([]);

      const assets = await repository.getAll();

      expect(assets).toStrictEqual([]);
    });

    it('preserves assets from different accounts when updating', async () => {
      const assetForAccount1 = {
        ...MOCK_ASSET_ENTITY_0,
        keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      };

      await repository.saveMany([MOCK_ASSET_ENTITY_0, assetForAccount1]);

      const updatedAsset = {
        ...MOCK_ASSET_ENTITY_0,
        rawAmount: '555555555',
        uiAmount: '0.555555555',
      };

      await repository.saveMany([updatedAsset]);

      const assetsForAccount0 = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );
      const assetsForAccount1 = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      );

      expect(assetsForAccount0).toStrictEqual([updatedAsset]);
      expect(assetsForAccount1).toStrictEqual([assetForAccount1]);
    });

    it('handles duplicate assets in the same save operation', async () => {
      const duplicateAsset = {
        ...MOCK_ASSET_ENTITY_0,
        rawAmount: '123456789',
        uiAmount: '0.123456789',
      };

      await repository.saveMany([MOCK_ASSET_ENTITY_0, duplicateAsset]);

      const assets = await repository.findByKeyringAccountId(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      // The last occurrence should win
      expect(assets).toStrictEqual([duplicateAsset]);
    });
  });
});
