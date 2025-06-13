import {
  InternalError,
  type OnAssetsConversionHandler,
} from '@metamask/snaps-sdk';

import { tokenPricesService } from '../../../snapContext';
import logger from '../../utils/logger';

export const onAssetsConversion: OnAssetsConversionHandler = async (params) => {
  try {
    logger.log('[💱 onAssetsConversion]', params);

    const { conversions, includeMarketData } = params;

    // TODO: There might be NFTs in the conversions, we need to handle them differently

    const conversionRates =
      await tokenPricesService.getMultipleTokenConversions(
        conversions,
        includeMarketData,
      );

    return {
      conversionRates,
    };
  } catch (error: any) {
    logger.error('[💱 onAssetsConversion]', error);
    throw new InternalError(error) as Error;
  }
};
