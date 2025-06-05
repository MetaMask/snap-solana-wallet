import { literal } from '@metamask/snaps-sdk';
import { object } from '@metamask/superstruct';
import { JsonRpcIdStruct, JsonRpcVersionStruct } from '@metamask/utils';

import { SolanaSignAndSendTransactionInputStruct } from '../../services/wallet/structs';
import { ClientRequestMethod } from './types';

export const SignAndSendTransactionWithoutConfirmationRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(
    ClientRequestMethod.SignAndSendTransactionWithoutConfirmation,
  ),
  params: SolanaSignAndSendTransactionInputStruct,
});
