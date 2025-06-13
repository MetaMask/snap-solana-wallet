import {
  array,
  integer,
  object,
  optional,
  string,
} from '@metamask/superstruct';

import { TokenCaip19IdFromStringStruct } from '../../constants/solana';
import { UrlStruct } from '../../validation/structs';

export const TokenMetadataStruct = object({
  decimals: integer(),
  assetId: TokenCaip19IdFromStringStruct,
  name: optional(string()),
  symbol: optional(string()),
  iconUrl: optional(UrlStruct),
});

export const TokenMetadataResponseStruct = array(TokenMetadataStruct);
