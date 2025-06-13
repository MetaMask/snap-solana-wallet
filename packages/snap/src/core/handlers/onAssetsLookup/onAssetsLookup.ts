import type { CaipAssetType } from '@metamask/keyring-api';

import { assetsService } from '../../../snapContext';

export const onAssetsLookup = async ({
  assets,
}: {
  assets: CaipAssetType[];
}) => {
  const metadata = await assetsService.getAssetsMetadata(assets);
  return { assets: metadata };
};
