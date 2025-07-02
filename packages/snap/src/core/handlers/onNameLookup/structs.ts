import { object, optional, string } from '@metamask/superstruct';

import { NetworkStruct } from '../../validation/structs';

export const SolanaNameLookupRequestStruct = object({
  chainId: NetworkStruct,
  domain: optional(string()),
  address: optional(string()),
});
