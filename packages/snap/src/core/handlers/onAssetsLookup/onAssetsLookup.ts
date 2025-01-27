import type { OnAssetsLookupHandler } from '@metamask/snaps-sdk';

import { tokenMetadataClient } from '../../../snapContext';

export const onAssetsLookup: OnAssetsLookupHandler = async (params) => {
  const { assets } = params;

  const metadata = await tokenMetadataClient.getTokenMetadataFromAddresses(
    assets,
  );

  return { assets: metadata };
};
