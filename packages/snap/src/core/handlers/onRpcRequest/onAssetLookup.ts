import type { CaipAssetType } from '@metamask/keyring-api';
import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { tokenMetadataClient } from '../../../snapContext';
import { OnAssetLookupStruct } from '../../validation/structs';
import { validateRequest } from '../../validation/validators';

export const onAssetLookup: OnRpcRequestHandler = async ({ request }) => {
  const { params } = request;

  validateRequest(params, OnAssetLookupStruct);

  const { assets } = params as {
    assets: CaipAssetType[];
  };

  const metadata = await tokenMetadataClient.getTokenMetadataFromAddresses(
    assets,
  );

  return metadata;
};
