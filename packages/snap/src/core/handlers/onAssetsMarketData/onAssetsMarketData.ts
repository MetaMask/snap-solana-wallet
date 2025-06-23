import type { OnAssetsMarketDataHandler } from '@metamask/snaps-sdk';

import { assetsService } from '../../../snapContext';
import logger from '../../utils/logger';

export const onAssetsMarketData: OnAssetsMarketDataHandler = async (params) => {
  logger.log('[💰 onAssetsMarketData]', params);

  const { assets } = params;

  const marketData = await assetsService.getAssetsMarketData(assets);

  return { marketData };
};
