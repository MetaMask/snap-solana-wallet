import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { renderSend } from '../../../features/send/render';
import { eventEmitter } from '../../../snapContext';
import { getFeeForTransaction } from './getFeeForTransaction';
import { RpcRequestMethod, TestDappRpcRequestMethod } from './types';

export const handlers: Record<RpcRequestMethod, OnRpcRequestHandler> = {
  [RpcRequestMethod.StartSendTransactionFlow]: renderSend,
  [RpcRequestMethod.GetFeeForTransaction]: getFeeForTransaction,

  // Methods specific to the test dapp
  [TestDappRpcRequestMethod.ListWebSockets as any]: async () => {
    await eventEmitter.emitSync('onListWebSockets');
    return null;
  },
  [TestDappRpcRequestMethod.ListSubscriptions as any]: async () => {
    await eventEmitter.emitSync('onListSubscriptions');
    return null;
  },
  [TestDappRpcRequestMethod.TestOnStart as any]: async () => {
    await eventEmitter.emitSync('onStart');
    return null;
  },
  [TestDappRpcRequestMethod.TestOnInstall as any]: async () => {
    await eventEmitter.emitSync('onInstall');
    return null;
  },
  [TestDappRpcRequestMethod.TestOnUpdate as any]: async () => {
    await eventEmitter.emitSync('onUpdate');
    return null;
  },
};
