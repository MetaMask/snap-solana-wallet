import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { SolanaInternalRpcMethods } from '../../constants/solana';
import { listAccountAssets } from './listAccountAssets';
import { renderSend } from './renderSend';

export const handlers: Partial<
  Record<SolanaInternalRpcMethods, OnRpcRequestHandler>
> = {
  [SolanaInternalRpcMethods.StartSendTransactionFlow]: renderSend,
  [SolanaInternalRpcMethods.ListAccountAssets]: listAccountAssets,
  // Register new handlers here
};
