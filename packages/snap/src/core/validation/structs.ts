import { SolMethod } from '@metamask/keyring-api';
import type { Infer } from 'superstruct';
import {
  array,
  enums,
  nullable,
  number,
  object,
  optional,
  pattern,
  record,
  refine,
  string,
} from 'superstruct';

import { Caip19Id, Network } from '../constants/solana';

// create a uuid validation
export const Uuid = pattern(
  string(),
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
);

export const PositiveNumber = refine(number(), 'positive', (value) => {
  if (value < 0) {
    return `Expected a positive number but received a negative number ${value}`;
  }
  return true;
});

export const PositiveNumberStringStruct = pattern(
  string(),
  /^(?!0\d)(\d+(\.\d+)?)$/u,
);

/**
 * Validates a CAIP-19 asset identifier string, for instance
 * "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501"
 */
export const Caip19Struct = pattern(
  string(),
  /^[-a-z0-9]{3,8}:[-a-zA-Z0-9]{1,64}\/[-a-zA-Z0-9]{1,64}(:[-a-zA-Z0-9]{1,64})?$/u,
);
export const AssetsStruct = enums(Object.values(Caip19Id));

/**
 * Keyring validations
 */
export const GetAccountStruct = object({
  accountId: Uuid,
});
export const DeleteAccountStruct = object({
  accountId: Uuid,
});
export const ListAccountAssetsStruct = object({
  accountId: Uuid,
});
export const GetAccountBalancesStruct = object({
  accountId: Uuid,
  assets: array(Caip19Struct),
});
export const ListAccountTransactionsStruct = object({
  accountId: Uuid,
  pagination: object({
    limit: number(),
    next: optional(nullable(string())),
  }),
});

export const GetAccounBalancesResponseStruct = record(
  Caip19Struct,
  object({
    amount: PositiveNumberStringStruct,
    unit: string(),
  }),
);

export const ListAccountAssetsResponseStruct = array(Caip19Struct);

export const SubmitRequestMethodStruct = enums(Object.values(SolMethod));

export const SendAndConfirmTransactionParamsStruct = object({
  base64EncodedTransactionMessage: string(),
});

export type SendAndConfirmTransactionParams = Infer<
  typeof SendAndConfirmTransactionParamsStruct
>;

export const NetworkStruct = enums(Object.values(Network));
