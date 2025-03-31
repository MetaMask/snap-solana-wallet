import { array, literal, object, optional } from '@metamask/superstruct';

import { UuidStruct } from '../../validation/structs';

export enum SolanaProtocolRequestMethod {
  GetGenesisHash = 'getGenesisHash',
  GetLatestBlockhash = 'getLatestBlockhash',
}

export const SolanaGetGenesisHashRequestStruct = object({
  jsonrpc: literal('2.0'),
  id: UuidStruct,
  method: literal(SolanaProtocolRequestMethod.GetGenesisHash),
  params: optional(array()),
});

export const SolanaGetLatestBlockhashRequestStruct = object({
  jsonrpc: literal('2.0'),
  id: UuidStruct,
  method: literal(SolanaProtocolRequestMethod.GetLatestBlockhash),
});
