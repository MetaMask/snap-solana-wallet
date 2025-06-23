import { InternalError, type CaipAssetType } from '@metamask/snaps-sdk';

import { assetsService } from '../../../snapContext';
import logger from '../../utils/logger';
import type { FungibleAssetMarketData } from '../../services/assets/AssetsService';

// FIXME: Use the Keyring API types
type OnAssetsMarketDataHandler = (params: {
  assets: {
    asset: CaipAssetType;
    unit: CaipAssetType;
  }[];
}) => Promise<{
  marketData: Record<CaipAssetType, FungibleAssetMarketData>;
}>;

export const onAssetsMarketData: OnAssetsMarketDataHandler = async (params) => {
  try {
    logger.log('[💰 onAssetsMarketData]', params);

    const { assets } = params;

    const marketData = await assetsService.getAssetsMarketData(assets);
    return { marketData };
  } catch (error: any) {
    logger.error('[💰 onAssetsMarketData]', error);
    throw new InternalError(error) as Error;
  }
};

export type { FungibleAssetMarketData };