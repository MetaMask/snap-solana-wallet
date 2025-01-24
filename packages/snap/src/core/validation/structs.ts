import { SolMethod } from '@metamask/keyring-api';
import type { Infer } from 'superstruct';
import {
  array,
  enums,
  number,
  object,
  pattern,
  record,
  refine,
  string,
} from 'superstruct';

import { Caip19Id } from '../constants/solana';

// create a uuid validation
export const UuidStruct = pattern(
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
export const GetAccountStruct = UuidStruct;
export const DeleteAccountStruct = UuidStruct;
export const ListAccountAssetsStruct = UuidStruct;
export const GetAccountBalancesStruct = object({
  id: UuidStruct,
  assets: array(Caip19Struct),
});
export const ListAccountTransactionsStruct = object({
  id: UuidStruct,
  pagination: object({
    limit: number(),
    next: string(),
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

export const OnAssetConversionStruct = object({
  conversions: array(
    object({
      from: Caip19Struct,
      to: Caip19Struct,
    }),
  ),
});

export const OnAssetLookupStruct = object({
  assets: array(Caip19Struct),
});
