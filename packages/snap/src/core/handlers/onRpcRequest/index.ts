import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { renderSend } from '../../../features/send/render';
import { eventEmitter } from '../../../snapContext';
import { getFeeForTransaction } from './getFeeForTransaction';
import { RpcRequestMethod, TestDappRpcRequestMethod } from './types';

export const handlers: Record<RpcRequestMethod, OnRpcRequestHandler> = {
  [RpcRequestMethod.StartSendTransactionFlow]: renderSend,
  [RpcRequestMethod.GetFeeForTransaction]: getFeeForTransaction,

  // Methods specific to the test dapp
  [TestDappRpcRequestMethod.TestSetupAllConnections as any]: async () => {
    await eventEmitter.emitSync('onTestSetupAllConnections');
    return null;
  },
  [TestDappRpcRequestMethod.TestSubscribeToAccount as any]: async () => {
    await eventEmitter.emitSync('onTestSubscribeToAccount');
    return null;
  },
  [TestDappRpcRequestMethod.TestCloseAllConnections as any]: async () => {
    await eventEmitter.emitSync('onTestCloseAllConnections');
    return null;
  },
};
