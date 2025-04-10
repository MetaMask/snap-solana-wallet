import type { OnAssetHistoricalPriceHandler } from '@metamask/snaps-sdk';

import type { HistoricalPrice } from '../../services/token-prices/types';
import logger from '../../utils/logger';

export const onAssetHistoricalPrice: OnAssetHistoricalPriceHandler = async (
  params,
) => {
  try {
    logger.log('[📈 onAssetHistoricalPrice]', params);

    const { from, to } = params;

    const historicalPrice: HistoricalPrice = {
      intervals: {},
      updateTime: 0,
      expirationTime: 0,
    };

    return {
      historicalPrice,
    };
  } catch (error: any) {
    logger.error('[📈 onAssetHistoricalPrice]', error);
    return null;
  }
};
