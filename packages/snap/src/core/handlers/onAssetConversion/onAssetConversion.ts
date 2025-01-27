import type { CaipAssetType } from '@metamask/keyring-api';
import type { OnAssetsConversionHandler } from '@metamask/snaps-sdk';

import { tokenPricesService } from '../../../snapContext';
import { OnAssetConversionStruct } from '../../validation/structs';
import { validateRequest } from '../../validation/validators';

export const onAssetConversion: OnAssetsConversionHandler = async (params) => {
  validateRequest(params, OnAssetConversionStruct);

  const { conversions } = params;

  const result = await tokenPricesService.getMultipleTokenConversions(
    conversions,
  );

  return {
    conversionRates: result,
  };
};
