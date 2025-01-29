import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { renderSend } from './renderSend';
import { submitBridgeTx } from './submitBridgeTx';
import { RpcRequestMethod } from './types';

export const handlers: Record<RpcRequestMethod, OnRpcRequestHandler> = {
  [RpcRequestMethod.StartSendTransactionFlow]: renderSend,
  [RpcRequestMethod.SubmitBridgeTx]: submitBridgeTx,
};
