/* eslint-disable @typescript-eslint/naming-convention */

import type { CaipAssetType } from '@metamask/keyring-api';
import type { FungibleAssetMetadata } from '@metamask/snaps-sdk';

export type SolanaTokenMetadata = FungibleAssetMetadata & {
  imageSvg?: string;
};

export type TokenMetadata = {
  decimals: number;
  assetId: CaipAssetType;
  name: string;
  symbol: string;
  iconUrl?: string;
};
