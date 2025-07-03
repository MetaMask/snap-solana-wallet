/* eslint-disable @typescript-eslint/naming-convention */

import type { FungibleAssetMetadata } from '@metamask/snaps-sdk';
import type { Infer } from '@metamask/superstruct';

import type { TokenCaip19Id } from '../../constants/solana';
import type { TokenMetadataStruct } from './structs';

export type SolanaTokenMetadata = FungibleAssetMetadata;

export type TokenMetadata = Infer<typeof TokenMetadataStruct> & {
  assetId: TokenCaip19Id;
};
