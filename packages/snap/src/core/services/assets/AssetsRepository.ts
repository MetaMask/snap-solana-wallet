import { cloneDeep } from 'lodash';

import type { AssetEntity } from '../../../entities';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';

export class AssetsRepository {
  readonly #state: IStateManager<UnencryptedStateValue>;

  constructor(state: IStateManager<UnencryptedStateValue>) {
    this.#state = state;
  }

  async findByKeyringAccountId(
    keyringAccountId: string,
  ): Promise<AssetEntity[]> {
    const assets = await this.#state.getKey<AssetEntity[]>(
      `assetEntities.${keyringAccountId}`,
    );

    return assets ?? [];
  }

  async getAll(): Promise<AssetEntity[]> {
    const assetsByAccount =
      (await this.#state.getKey<UnencryptedStateValue['assetEntities']>(
        'assetEntities',
      )) ?? {};

    return Object.values(assetsByAccount).flat();
  }

  async saveMany(assets: AssetEntity[]): Promise<void> {
    // Update the state atomically
    await this.#state.update((stateValue) => {
      const newState = cloneDeep(stateValue);
      for (const asset of assets) {
        const { keyringAccountId } = asset;
        const accountAssets = cloneDeep(
          newState.assetEntities[keyringAccountId] ?? [],
        );

        // Avoid duplicates. If same asset is already saved, override it.
        const existingAssetIndex = accountAssets.findIndex(
          (item) =>
            item.assetType === asset.assetType &&
            item.keyringAccountId === asset.keyringAccountId,
        );

        if (existingAssetIndex === -1) {
          accountAssets.push(asset);
        } else {
          accountAssets[existingAssetIndex] = asset;
        }

        newState.assetEntities[keyringAccountId] = accountAssets;
      }
      return newState;
    });
  }
}
