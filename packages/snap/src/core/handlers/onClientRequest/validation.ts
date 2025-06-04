import { object, string } from '@metamask/superstruct';

import { TransactionIntentStruct } from '../../domain';
import { Base64Struct } from '../../validation/structs';

export const SignAndSendTransactionWithIntentParamsStruct = object({
  intent: TransactionIntentStruct,
  transaction: Base64Struct,
  signature: string(),
});
