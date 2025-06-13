import type { CaipAssetType, FungibleAssetMetadata } from '@metamask/snaps-sdk';
import { type OnAssetsLookupHandler } from '@metamask/snaps-sdk';
import { parseCaipAssetType } from '@metamask/utils';

import { assetsService } from '../../../snapContext';
import type { NativeCaip19Id, TokenCaip19Id } from '../../constants/solana';
import logger from '../../utils/logger';

export const onAssetsLookup: OnAssetsLookupHandler = async (params) => {
  logger.log('[🔍 onAssetsLookup]', params);

  const { assets } = params;

  /**
   * TODO: Remove me when we have the new version of Snaps SDK
   */
  const fungibleAssets = assets.filter((asset) => {
    const { assetNamespace } = parseCaipAssetType(asset);
    return assetNamespace === 'token' || assetNamespace === 'solana';
  }) as (TokenCaip19Id | NativeCaip19Id)[];

  const metadata = (await assetsService.getAssetsMetadata(
    fungibleAssets,
  )) as Record<CaipAssetType, FungibleAssetMetadata | null>;

  return { assets: metadata };
};
