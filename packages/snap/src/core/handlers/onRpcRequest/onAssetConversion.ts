import type { CaipAssetType } from '@metamask/keyring-api';
import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { tokenPricesService } from '../../../snapContext';
import { OnAssetConversionStruct } from '../../validation/structs';
import { validateRequest } from '../../validation/validators';

export const onAssetConversion: OnRpcRequestHandler = async ({ request }) => {
  const { params } = request;

  validateRequest(params, OnAssetConversionStruct);

  const { conversions } = params as {
    conversions: { from: CaipAssetType; to: CaipAssetType }[];
  };

  const result = await tokenPricesService.getMultipleTokenConversions(
    conversions,
  );

  return result;
};
