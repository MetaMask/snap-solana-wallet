import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { onAssetConversion } from './onAssetConversion';
import { onAssetLookup } from './onAssetLookup';
import { renderSend } from './renderSend';
import { RpcRequestMethod } from './types';

export const handlers: Record<RpcRequestMethod, OnRpcRequestHandler> = {
  [RpcRequestMethod.StartSendTransactionFlow]: renderSend,
  [RpcRequestMethod.OnAssetConversion]: onAssetConversion,
  [RpcRequestMethod.OnAssetLookup]: onAssetLookup,
};
