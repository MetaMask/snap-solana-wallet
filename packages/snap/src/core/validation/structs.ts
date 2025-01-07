import type { Infer } from 'superstruct';
import {
  enums,
  number,
  object,
  optional,
  pattern,
  record,
  refine,
  string,
} from 'superstruct';

import {
  SOL_SYMBOL,
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../constants/solana';

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
 * Validates a Solana asset string, for instance
 * "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501"
 */
export const AssetsStruct = enums(
  Object.values(SolanaCaip2Networks).map(
    (network) => `${network}/${SolanaCaip19Tokens.SOL}`,
  ),
);

export const GetAccounBalancesResponseStruct = record(
  AssetsStruct,
  object({
    amount: PositiveNumberStringStruct,
    unit: enums([SOL_SYMBOL as string]),
  }),
);

export const SendAndConfirmTransactionParamsStruct = object({
  to: string(),
  mintAddress: optional(string()),
  amount: PositiveNumber,
});

export type SendAndConfirmTransactionParams = Infer<
  typeof SendAndConfirmTransactionParamsStruct
>;
