import { literal } from '@metamask/snaps-sdk';
import { nullable, number, object, string, union } from '@metamask/superstruct';

import { SolanaSignAndSendTransactionInputStruct } from '../../services/wallet/structs';
import { ClientRequestMethod } from './types';

export const SignAndSendTransactionWithoutConfirmationRequestStruct = object({
  id: nullable(union([string(), number()])),
  jsonrpc: literal('2.0'),
  method: literal(
    ClientRequestMethod.SignAndSendTransactionWithoutConfirmation,
  ),
  params: SolanaSignAndSendTransactionInputStruct,
});
