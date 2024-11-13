import { enums, object, record } from 'superstruct';

import {
  SOL_SYMBOL,
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../constants/solana';
import { PositiveNumberStringStruct } from './number';

export const AssetsStruct = enums([
  `${SolanaCaip2Networks.Mainnet}/${SolanaCaip19Tokens.SOL}`,
  `${SolanaCaip2Networks.Testnet}/${SolanaCaip19Tokens.SOL}`,
  `${SolanaCaip2Networks.Devnet}/${SolanaCaip19Tokens.SOL}`,
]);

export const GetAccounBalancesResponseStruct = record(
  AssetsStruct,
  object({
    amount: PositiveNumberStringStruct,
    unit: enums([SOL_SYMBOL as string]),
  }),
);
