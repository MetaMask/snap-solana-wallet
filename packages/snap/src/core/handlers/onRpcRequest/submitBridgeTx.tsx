import { SolMethod } from '@metamask/keyring-api';
import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { assert, enums, nonempty, object, string } from 'superstruct';

import { keyring } from '../../../snapContext';
import { Network } from '../../constants/solana';

export const SubmitBridgeTxParamsStruct = object({
  scope: enums([...Object.values(Network)]),
  account: nonempty(string()),
  base64EncodedTransactionMessage: nonempty(string()),
});

export const submitBridgeTx: OnRpcRequestHandler = async ({ request }) => {
  const { params, id } = request;
  assert(params, SubmitBridgeTxParamsStruct);

  const { scope, account: accountId } = params;

  const res = await keyring.handleSendAndConfirmBridgeTransaction({
    id: id?.toString(),
    scope,
    account: accountId,
    request: {
      method: SolMethod.SendAndConfirmTransaction,
      id: id?.toString(),
      params: {
        base64EncodedTransactionMessage: params.base64EncodedTransactionMessage,
      },
    },
  });
  const { signature } = res;

  return res;
};
