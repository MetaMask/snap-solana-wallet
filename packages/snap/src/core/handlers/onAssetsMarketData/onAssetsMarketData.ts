import type { OnAssetsMarketDataHandler } from '@metamask/snaps-sdk';
import { InternalError } from '@metamask/snaps-sdk';

import { assetsService } from '../../../snapContext';
import logger from '../../utils/logger';

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
