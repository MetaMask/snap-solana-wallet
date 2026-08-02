import { AssetsProvider } from '@metamask-previews/snap-networks-utils';
import type { AssetsProviderMessenger } from '@metamask-previews/snap-networks-utils';
import type { Asset, Caip19AssetId } from '@metamask/assets-controller';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { parseCaipAssetType } from '@metamask/utils';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { address as asAddress } from '@solana/kit';

import type { AssetEntity } from '../../../../entities';
import type {
  NativeCaipAssetType,
  Network,
  TokenCaipAssetType,
} from '../../../constants/solana';
import { SolanaCaip19Tokens } from '../../../constants/solana';
import { fromTokenUnits } from '../../../utils/fromTokenUnit';

function isSupportedProviderAsset(assetId: string): boolean {
  return !assetId.includes('/nft:');
}

async function mapProviderAsset(
  accountId: string,
  assetId: CaipAssetType,
  accountAddress: string,
  asset: Asset,
): Promise<AssetEntity> {
  const { chainId, assetReference } = parseCaipAssetType(assetId);
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

export class CoreAssetsAdapter {
  readonly #provider: AssetsProvider;

  constructor(messenger: AssetsProviderMessenger) {
    this.#provider = new AssetsProvider({ messenger });
  }

  async getAccountAssetByID(
    accountId: string,
    assetId: CaipAssetType,
    accountAddress: string,
  ): Promise<AssetEntity | null> {
    const result = await this.#provider.getAccountAssetByID(accountId, assetId);
    if (!result) {
      return null;
    }
    return mapProviderAsset(accountId, assetId, accountAddress, result);
  }

  async getAccountAssetsByIDs(
    accountId: string,
    assetIds: string[],
    accountAddress: string,
  ): Promise<Record<string, AssetEntity | null>> {
    const fungibleAssetIds = assetIds.filter(isSupportedProviderAsset);
    const providerAssets = fungibleAssetIds.length
      ? await this.#provider.getAccountAssetsByIDs(
          accountId,
          fungibleAssetIds as Caip19AssetId[],
        )
      : {};

    const entries = await Promise.all(
      assetIds.map(async (assetId) => {
        if (!isSupportedProviderAsset(assetId)) {
          return [assetId, null] as const;
        }
        const asset = providerAssets[assetId as Caip19AssetId];
        if (!asset) {
          return [assetId, null] as const;
        }
        const entity = await mapProviderAsset(
          accountId,
          assetId as CaipAssetType,
          accountAddress,
          asset,
        );
        return [assetId, entity] as const;
      }),
    );

    return Object.fromEntries(entries);
  }

  async getAccountAssetsByScope(
    scope: CaipChainId,
    accountId: string,
    accountAddress: string,
  ): Promise<AssetEntity[]> {
    const providerAssets = await this.#provider.getAccountAssetsByScope(
      scope,
      accountId,
    );

    const supportedEntries = Object.entries(providerAssets).filter(
      ([assetId]) => isSupportedProviderAsset(assetId),
    );

    return Promise.all(
      supportedEntries.map(([assetId, asset]) =>
        mapProviderAsset(
          accountId,
          assetId as CaipAssetType,
          accountAddress,
          asset,
        ),
      ),
    );
  }
}
