import { array, enums, literal, object, optional } from '@metamask/superstruct';

import { UuidStruct } from '../../validation/structs';

export enum SolanaProtocolRequestMethod {
  GetGenesisHash = 'getGenesisHash',
}

export const SolanaGetGenesisHashRequestStruct = object({
  jsonrpc: literal('2.0'),
  id: UuidStruct,
  method: enums(Object.values(SolanaProtocolRequestMethod)),
  params: optional(array()),
});
