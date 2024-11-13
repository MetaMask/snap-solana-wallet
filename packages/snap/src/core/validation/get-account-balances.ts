import { enums, object, record } from 'superstruct';

import { SOL_CAIP_19, SOL_SYMBOL } from '../constants/solana';
import { PositiveNumberStringStruct } from './number';

export const AssetsStruct = enums([SOL_CAIP_19 as string]);

export const GetAccounBalancesResponseStruct = record(
  AssetsStruct,
  object({
    amount: PositiveNumberStringStruct,
    unit: enums([SOL_SYMBOL as string]),
  }),
);
