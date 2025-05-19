/* eslint-disable @typescript-eslint/naming-convention */

import type { FungibleAssetMetadata } from '@metamask/snaps-sdk';
import type { Infer } from '@metamask/superstruct';

import type { TokenMetadataStruct } from './structs';

/**
 * TODO: This is a temporary type to allow for setting the `fungible` property to `false` when the token is an NFT.
 * Once the changes in [this PR](https://github.com/MetaMask/SIPs/pull/174) are implemented on the snap SDK,
 * we can remove this type and use the `FungibleAssetMetadata` type directly.
 */
type NonFungibleAssetMetadata = Omit<FungibleAssetMetadata, 'fungible'> & {
  fungible: false;
};

export type SolanaTokenMetadata =
  | FungibleAssetMetadata
  | NonFungibleAssetMetadata;

export type TokenMetadata = Infer<typeof TokenMetadataStruct>;
