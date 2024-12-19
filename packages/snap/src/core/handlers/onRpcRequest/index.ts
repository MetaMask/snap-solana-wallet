import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { listAccountAssets } from './listAccountAssets';
import { renderSend } from './renderSend';
import { RpcRequestMethod } from './types';

export const handlers: Record<RpcRequestMethod, OnRpcRequestHandler> = {
  [RpcRequestMethod.StartSendTransactionFlow]: renderSend,
  [RpcRequestMethod.ListAccountAssets]: listAccountAssets,
};
