import type { Asset, ChainId } from '@metamask/assets-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { parseCaipAssetType, type CaipAssetType } from '@metamask/utils';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { address as asAddress } from '@solana/kit';

import type { AssetEntity } from '../../../entities';
import type { CoreMessengerCaller } from '../../../types/core-messenger';
import type {
  NativeCaipAssetType,
  Network,
  TokenCaipAssetType,
} from '../../constants/solana';
import { SolanaCaip19Tokens } from '../../constants/solana';
import { fromTokenUnits } from '../../utils/fromTokenUnit';

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
    return this.#mapAsset(accountId, assetId, accountAddress, result);
  }

  async getAccountAssets(
    accountId: string,
    accountAddress: string,
    chainIds: string[],
  ): Promise<AssetEntity[]> {
    // State-read path only needs account id for AssetsController:getAssets.
    const byAccount = await this.#coreMessenger.call(
      'AssetsController:getAssets',
      [{ id: accountId }] as InternalAccount[],
      { chainIds: chainIds as ChainId[] },
    );
    const accountAssets = byAccount[accountId] ?? {};
    const entities: AssetEntity[] = [];
    for (const [assetId, asset] of Object.entries(accountAssets)) {
      entities.push(
        await this.#mapAsset(accountId, assetId, accountAddress, asset),
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
    // State-read path only needs account id for AssetsController:getAssets.
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
        return this.#mapAsset(accountId, assetId, accountAddress, asset);
      }),
    );
  }

  async #mapAsset(
    accountId: string,
    assetId: string,
    accountAddress: string,
    asset: Asset,
  ): Promise<AssetEntity> {
    const { chainId, assetReference } = parseCaipAssetType(
      assetId as CaipAssetType,
    );
    const decimals = asset.metadata.decimals ?? 0;
    const symbol = asset.metadata.symbol ?? 'UNKNOWN';
    const rawAmount = asset.balance.amount;
    const uiAmount = fromTokenUnits(rawAmount, decimals);
    const network = chainId as Network;

    if (assetId.endsWith(SolanaCaip19Tokens.SOL)) {
      return {
        assetType: assetId as NativeCaipAssetType,
        keyringAccountId: accountId,
        network,
        address: accountAddress,
        symbol,
        decimals,
        rawAmount,
        uiAmount,
      };
    }

    const mint = assetReference;
    const [pubkey] = await findAssociatedTokenPda({
      mint: asAddress(mint),
      owner: asAddress(accountAddress),
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    return {
      assetType: assetId as TokenCaipAssetType,
      keyringAccountId: accountId,
      network,
      mint,
      pubkey,
      symbol,
      decimals,
      rawAmount,
      uiAmount,
    };
  }
}
