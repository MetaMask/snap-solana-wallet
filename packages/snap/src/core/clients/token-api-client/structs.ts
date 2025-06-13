import {
  array,
  integer,
  object,
  optional,
  string,
} from '@metamask/superstruct';
import { CaipAssetTypeStruct } from '@metamask/utils';

import { UrlStruct } from '../../validation/structs';

export const TokenMetadataStruct = object({
  decimals: integer(),
  assetId: CaipAssetTypeStruct,
  name: optional(string()),
  symbol: optional(string()),
  iconUrl: optional(UrlStruct),
});

export const TokenMetadataResponseStruct = array(TokenMetadataStruct);
