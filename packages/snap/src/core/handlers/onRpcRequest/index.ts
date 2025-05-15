import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { renderSend } from '../../../features/send/render';
import { getFeeForTransaction } from './getFeeForTransaction';
import { RpcRequestMethod } from './types';
import { getMinimumBalanceForRentExemption } from './getMinimumBalanceForRentExemption';

export const handlers: Record<RpcRequestMethod, OnRpcRequestHandler> = {
  [RpcRequestMethod.StartSendTransactionFlow]: renderSend,
  [RpcRequestMethod.GetFeeForTransaction]: getFeeForTransaction,
  [RpcRequestMethod.GetMinimumBalanceForRentExemption]: getMinimumBalanceForRentExemption,
};
