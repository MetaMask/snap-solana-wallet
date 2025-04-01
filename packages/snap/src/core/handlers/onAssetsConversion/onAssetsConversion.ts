import type { OnAssetsConversionHandler } from '@metamask/snaps-sdk';

import { tokenPricesService } from '../../../snapContext';

export const onAssetsConversion: OnAssetsConversionHandler = async (params) => {
  const { conversions } = params;

  const conversionRates = await tokenPricesService.getMultipleTokenConversions(
    conversions,
  );

  return {
    conversionRates,
  };
};
