import { type OnAssetsConversionHandler } from '@metamask/snaps-sdk';

import { tokenPricesService } from '../../../snapContext';
import logger from '../../utils/logger';

export const onAssetsConversion: OnAssetsConversionHandler = async (params) => {
  logger.log('[💱 onAssetsConversion]', params);

  const { conversions } = params;

  const conversionRates =
    await tokenPricesService.getMultipleTokenConversions(conversions);

  return {
    conversionRates,
  };
};
