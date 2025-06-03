import type { Infer } from '@metamask/superstruct';
import { object, string } from '@metamask/superstruct';
import type { Json } from '@metamask/utils';
import { CaipAssetTypeStruct } from '@metamask/utils';

import { Base64Struct, UuidStruct } from '../../validation/structs';

export enum ClientRequestMethod {
  SignAndSendTransactionWithIntent = 'client_signAndSendTransactionWithIntent',
}

export const AssetAmountStruct = object({
  assetType: CaipAssetTypeStruct,
  amount: string(),
});

export const IntentStruct = object({
  id: UuidStruct,
  timestamp: string(),
  accountId: string(),
  from: AssetAmountStruct,
  to: AssetAmountStruct,
});

export const SignAndSendTransactionWithIntentParamsStruct = object({
  intent: IntentStruct,
  transaction: Base64Struct,
  signature: string(),
});

export type AssetAmount = Infer<typeof AssetAmountStruct>;

export type Intent = Infer<typeof IntentStruct>;

export type SignAndSendTransactionWithIntentParams = Infer<
  typeof SignAndSendTransactionWithIntentParamsStruct
>;

export type ClientRequestUseCase<TParams = any> = {
  execute: (params: TParams) => Promise<Json>;
};
