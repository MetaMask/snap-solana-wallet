import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';
import type { JsonRpcRequest } from '@metamask/utils';

import { renderSend } from '../../../features/send/render';
import {
  accountSelectedHandler,
  accountsSynchronizer,
  eventEmitter,
} from '../../../snapContext';
import { getFeeForTransaction } from './getFeeForTransaction';
import { RpcRequestMethod, TestDappRpcRequestMethod } from './types';

export const handlers: Record<RpcRequestMethod, OnRpcRequestHandler> = {
  // TODO: Deprecate this method.
  [RpcRequestMethod.GetFeeForTransaction]: getFeeForTransaction,

  [RpcRequestMethod.StartSendTransactionFlow]: renderSend,
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
  [TestDappRpcRequestMethod.SynchronizeAccounts as any]: async () => {
    await accountsSynchronizer.synchronize();
    return null;
  },
  [TestDappRpcRequestMethod.OnAccountSelected as any]: async ({
    request,
  }: {
    request: JsonRpcRequest;
  }) => {
    await accountSelectedHandler.handleOnAccountSelected(request);
    return null;
  },
  [TestDappRpcRequestMethod.OnAccountUnselected as any]: async ({
    request,
  }: {
    request: JsonRpcRequest;
  }) => {
    await accountSelectedHandler.handleOnAccountUnselected(request);
    return null;
  },
};
