import type { CaipAssetType } from '@metamask/keyring-api';
import type { OnAssetsLookupHandler } from '@metamask/snaps-sdk';

import { tokenMetadataClient } from '../../../snapContext';
import { OnAssetLookupStruct } from '../../validation/structs';
import { validateRequest } from '../../validation/validators';

export const onAssetsLookup: OnAssetsLookupHandler = async (params) => {
  validateRequest(params, OnAssetLookupStruct);

  const { assets } = params;

  const metadata = await tokenMetadataClient.getTokenMetadataFromAddresses(
    assets,
  );

  return { assets: metadata };
};
