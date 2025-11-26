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
    // Group assets by account to minimize state operations
    const assetsByAccount = assets.reduce<Record<string, AssetEntity[]>>(
      (acc, asset) => {
        const { keyringAccountId } = asset;
        if (!acc[keyringAccountId]) {
          acc[keyringAccountId] = [];
        }
        acc[keyringAccountId].push(asset);
        return acc;
      },
      {},
    );

    // Update each account's assets
    await Promise.all(
      Object.entries(assetsByAccount).map(
        async ([keyringAccountId, newAssets]) => {
          const existingAssets =
            (await this.#state.getKey<AssetEntity[]>(
              `assetEntities.${keyringAccountId}`,
            )) ?? [];

          const updatedAssets = [...existingAssets];

          // Update or add each asset
          newAssets.forEach((asset) => {
            // Avoid duplicates. If same asset is already saved, override it.
            const existingAssetIndex = updatedAssets.findIndex(
              (item) =>
                item.assetType === asset.assetType &&
                item.keyringAccountId === asset.keyringAccountId,
            );

            if (existingAssetIndex === -1) {
              updatedAssets.push(asset);
            } else {
              updatedAssets[existingAssetIndex] = asset;
            }
          });

          await this.#state.setKey(
            `assetEntities.${keyringAccountId}`,
            updatedAssets,
          );
        },
      ),
    );
  }
}
