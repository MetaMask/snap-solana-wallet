import {
  array,
  integer,
  object,
  optional,
  string,
} from '@metamask/superstruct';

import { Caip19Struct, UrlStruct } from '../../validation/structs';

export const TokenMetadataStruct = object({
  decimals: integer(),
  assetId: Caip19Struct,
  name: string(),
  symbol: string(),
  iconUrl: optional(UrlStruct),
});

export const TokenMetadataResponseStruct = array(TokenMetadataStruct);
