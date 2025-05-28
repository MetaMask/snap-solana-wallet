import { object, string, union } from '@metamask/superstruct';
import type { Json, JsonRpcRequest } from '@metamask/utils';
import { CaipAssetTypeStruct } from '@metamask/utils';

import { NetworkStruct, UuidStruct } from '../../validation/structs';

export enum ClientRequestMethod {
  SignAndSendTransactionWithIntent = 'signAndSendTransactionWithIntent',
}

export const IntentStruct = object({
  id: UuidStruct,
  timestamp: string(),
  from: object({
    asset: CaipAssetTypeStruct,
    amount: string(), // Keep as string to preserve precision
  }),
  to: object({
    asset: CaipAssetTypeStruct,
    amount: string(), // Keep as string to preserve precision
  }),
});

export const SignAndSendTransactionWithIntentParamsStruct = object({
  intent: IntentStruct,
  tx: string(), // Base64 encoded transaction
  signature: string(), // Backend signature for verification
});

export const SignAndSendTransactionWithIntentRequestStruct = object({
  id: UuidStruct,
  scope: NetworkStruct,
  account: UuidStruct,
  request: SignAndSendTransactionWithIntentParamsStruct,
});

export const ClientRequestStruct = object({
  id: UuidStruct,
  scope: NetworkStruct,
  account: UuidStruct,
  request: union([SignAndSendTransactionWithIntentRequestStruct]),
});

export type ClientRequestUseCase = {
  execute: (request: JsonRpcRequest) => Promise<Json>;
};
