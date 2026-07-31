import type { Asset, ChainId } from '@metamask/assets-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';

import type { AssetEntity } from '../../../../entities';
import type { CoreMessengerCaller } from '../../../../types/core-messenger';

import { mapControllerAsset } from '../mapControllerAsset';

export class CoreAssetsAdapter {
  readonly #coreMessenger: CoreMessengerCaller;

  constructor(coreMessenger: CoreMessengerCaller) {
    this.#coreMessenger = coreMessenger;
  }

  async getAccountAsset(
    accountId: string,
    assetId: string,
    accountAddress: string,
  ): Promise<AssetEntity | null> {
    const result = await this.#coreMessenger.call(
      'AssetsController:getAsset',
      accountId,
      assetId as Asset['id'],
    );
    if (!result) {
      return null;
    }
    return mapControllerAsset(accountId, assetId, accountAddress, result);
  }

  async getAccountAssets(
    accountId: string,
    accountAddress: string,
    chainIds: string[],
  ): Promise<AssetEntity[]> {
    const byAccount = await this.#coreMessenger.call(
      'AssetsController:getAssets',
      [{ id: accountId }] as InternalAccount[],
      { chainIds: chainIds as ChainId[] },
    );
    const accountAssets = byAccount[accountId] ?? {};
    const entities: AssetEntity[] = [];
    for (const [assetId, asset] of Object.entries(accountAssets)) {
      entities.push(
        await mapControllerAsset(
          accountId,
          assetId,
          accountAddress,
          asset as Asset,
        ),
      );
    }
    return entities;
  }

  async getAccountAssetsByIds(
    accountId: string,
    assetIds: string[],
    accountAddress: string,
    chainIds: string[],
  ): Promise<(AssetEntity | null)[]> {
    const byAccount = await this.#coreMessenger.call(
      'AssetsController:getAssets',
      [{ id: accountId }] as InternalAccount[],
      { chainIds: chainIds as ChainId[] },
    );
    const accountAssets = byAccount[accountId] ?? {};
    return Promise.all(
      assetIds.map(async (assetId) => {
        const asset = accountAssets[assetId as Asset['id']];
        if (!asset) {
          return null;
        }
        return mapControllerAsset(accountId, assetId, accountAddress, asset);
      }),
    );
  }
}
