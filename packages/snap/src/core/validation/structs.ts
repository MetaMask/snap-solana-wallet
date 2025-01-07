import type { Infer } from 'superstruct';
import {
  enums,
  number,
  object,
  pattern,
  record,
  refine,
  string,
} from 'superstruct';

import { Caip19Id } from '../constants/solana';

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

export const GetAccounBalancesResponseStruct = record(
  Caip19Struct,
  object({
    amount: PositiveNumberStringStruct,
    unit: string(),
  }),
);

export const TransferSolParamsStruct = object({
  to: string(),
  amount: PositiveNumber,
});

export type TransferSolParams = Infer<typeof TransferSolParamsStruct>;
