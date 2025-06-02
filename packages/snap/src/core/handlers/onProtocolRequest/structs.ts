import {
  array,
  literal,
  object,
  optional,
  tuple,
  number,
} from '@metamask/superstruct';
import { JsonRpcIdStruct, JsonRpcVersionStruct } from '@metamask/utils';

export enum SolanaProtocolRequestMethod {
  GetGenesisHash = 'getGenesisHash',
  GetLatestBlockhash = 'getLatestBlockhash',
  GetMinimumBalanceForRentExemption = 'getMinimumBalanceForRentExemption',
}

export const SolanaGetGenesisHashRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(SolanaProtocolRequestMethod.GetGenesisHash),
  params: optional(array()),
});

export const SolanaGetLatestBlockhashRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(SolanaProtocolRequestMethod.GetLatestBlockhash),
});

export const SolanaGetMinimumBalanceForRentExemptionRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(
    SolanaProtocolRequestMethod.GetMinimumBalanceForRentExemption,
  ),
  params: tuple([number(), optional(object())]),
});
