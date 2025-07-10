import {
  array,
  integer,
  object,
  optional,
  string,
} from '@metamask/superstruct';

import { TokenCaipAssetTypeFromStringStruct } from '../../constants/solana';
import { UrlStruct } from '../../validation/structs';

export const TokenMetadataStruct = object({
  decimals: integer(),
  assetId: TokenCaipAssetTypeFromStringStruct,
  name: optional(string()),
  symbol: optional(string()),
  iconUrl: optional(UrlStruct),
});

export const TokenMetadataResponseStruct = array(TokenMetadataStruct);
