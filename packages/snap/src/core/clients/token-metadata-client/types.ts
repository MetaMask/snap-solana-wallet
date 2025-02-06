/* eslint-disable @typescript-eslint/naming-convention */

import type { FungibleAssetMetadata } from '@metamask/snaps-sdk';
import type { Infer } from 'superstruct';

import type { TokenMetadataStruct } from './structs';

export type SolanaTokenMetadata = FungibleAssetMetadata & {
  imageSvg?: string;
};

export type TokenMetadata = Infer<typeof TokenMetadataStruct>;
