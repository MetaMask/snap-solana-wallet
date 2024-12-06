import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { renderSend } from './renderSend';

export enum OnRpcRequestMethods {
  StartSendTransactionFlow = 'startSendTransactionFlow',
}

export const handlers: Record<OnRpcRequestMethods, OnRpcRequestHandler> = {
  [OnRpcRequestMethods.StartSendTransactionFlow]: renderSend,
  // Register new handlers here
};
