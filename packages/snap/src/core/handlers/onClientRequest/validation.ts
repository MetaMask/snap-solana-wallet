import { object, string } from '@metamask/superstruct';

import { TransactionIntentSwapStruct } from '../../domain/TransactionIntent';
import { Base64Struct } from '../../validation/structs';

export const SignAndSendTransactionWithIntentParamsStruct = object({
  intent: TransactionIntentSwapStruct,
  transaction: Base64Struct,
  signature: string(),
});
