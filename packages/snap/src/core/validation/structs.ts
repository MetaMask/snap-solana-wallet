import type { Infer } from 'superstruct';
import { enums, number, object, pattern, record, string } from 'superstruct';

import { SOL_CAIP_19, SOL_SYMBOL } from '../constants/solana';

export const PositiveNumberStringStruct = pattern(
  string(),
  /^(?!0\d)(\d+(\.\d+)?)$/u,
);

export const AssetsStruct = enums([SOL_CAIP_19 as string]);

export const GetAccounBalancesResponseStruct = record(
  AssetsStruct,
  object({
    amount: PositiveNumberStringStruct,
    unit: enums([SOL_SYMBOL as string]),
  }),
);

export const TransferSolParamsStruct = object({
  to: string(),
  amount: number(),
});

export type TransferSolParams = Infer<typeof TransferSolParamsStruct>;
