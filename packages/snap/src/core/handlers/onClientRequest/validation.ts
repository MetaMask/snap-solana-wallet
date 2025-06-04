import { string, tuple } from '@metamask/superstruct';

import { IntentStruct } from '../../domain/Intent';
import { Base64Struct } from '../../validation/structs';

export const SignAndSendTransactionWithIntentParamsStruct = tuple([
  IntentStruct, // params[0] = intent
  Base64Struct, // params[1] = transaction
  string(), // params[2] = signature
]);
