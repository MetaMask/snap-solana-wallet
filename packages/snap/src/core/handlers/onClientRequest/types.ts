import type { Infer } from '@metamask/superstruct';
import { object, string } from '@metamask/superstruct';
import type { Json } from '@metamask/utils';
import { CaipAssetTypeStruct } from '@metamask/utils';

import { Base64Struct, UuidStruct } from '../../validation/structs';

export enum ClientRequestMethod {
  SignAndSendTransactionWithIntent = 'signAndSendTransactionWithIntent',
}

export const IntentStruct = object({
  id: UuidStruct,
  timestamp: string(),
  from: object({
    asset: CaipAssetTypeStruct,
    amount: string(),
  }),
  to: object({
    asset: CaipAssetTypeStruct,
    amount: string(),
  }),
});

export const SignAndSendTransactionWithIntentParamsStruct = object({
  intent: IntentStruct,
  tx: Base64Struct, // TODO: What type?
  signature: string(), // TODO: What type?
});

export type SignAndSendTransactionWithIntentParams = Infer<
  typeof SignAndSendTransactionWithIntentParamsStruct
>;

export type ClientRequestUseCase<TParams = any> = {
  execute: (params: TParams) => Promise<Json>;
};
