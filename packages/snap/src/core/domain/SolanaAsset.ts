import type { CaipAssetType } from '@metamask/keyring-api';

import type { Network } from './constants';

export type SolanaAsset = {
  scope: Network;
  assetType: CaipAssetType;
  balance: string;
  decimals: number;
  native: boolean;
};
