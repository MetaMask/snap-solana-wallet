import { type OnAssetsConversionHandler } from '@metamask/snaps-sdk';

import { tokenPricesService } from '../../../snapContext';
import logger from '../../utils/logger';

export const onAssetsConversion: OnAssetsConversionHandler = async (params) => {
  logger.log('[💱 onAssetsConversion]', params);

  const { conversions } = params;

  const includeMarketData = true;
  //   const { conversions, includeMarketData } = params; // TODO: Enable this when snaps SDK is updated

  const conversionRates = await tokenPricesService.getMultipleTokenConversions(
    conversions,
    includeMarketData,
  );

  return {
    conversionRates,
  };
};
