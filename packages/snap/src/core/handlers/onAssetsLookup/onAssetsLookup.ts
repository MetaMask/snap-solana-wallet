import { type OnAssetsLookupHandler } from '@metamask/snaps-sdk';

import { tokenMetadataClient } from '../../../snapContext';
import logger from '../../utils/logger';

export const onAssetsLookup: OnAssetsLookupHandler = async (params) => {
  logger.log('[🔍 onAssetsLookup]', params);

  const { assets } = params;

  const metadata =
    await tokenMetadataClient.getTokenMetadataFromAddresses(assets);

  return { assets: metadata };
};
