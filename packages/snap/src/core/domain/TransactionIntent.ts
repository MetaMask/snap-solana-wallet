import type { Infer } from '@metamask/superstruct';
import { literal, number, object, string, union } from '@metamask/superstruct';
import { CaipAccountAddressStruct, CaipAssetTypeStruct } from '@metamask/utils';

import { Iso8601Struct, UuidStruct } from '../validation/structs';

const TransactionIntentCommonStruct = object({
  id: UuidStruct,
  timestamp: Iso8601Struct,
  from: object({
    address: CaipAccountAddressStruct,
    asset: CaipAssetTypeStruct,
    amount: string(),
  }),
  to: object({
    address: CaipAccountAddressStruct,
    asset: CaipAssetTypeStruct,
    amount: string(),
  }),
});

const TransactionIntentSwapStruct = object({
  ...TransactionIntentCommonStruct.schema,
  type: literal('swap'),
  slippage: number(),
});

const TransactionIntentBridgeStruct = object({
  ...TransactionIntentCommonStruct.schema,
  type: literal('bridge'),
});

export const TransactionIntentStruct = union([
  TransactionIntentSwapStruct,
  TransactionIntentBridgeStruct,
]);

export type TransactionIntent = Infer<typeof TransactionIntentStruct>;
