import type { SolanaCaip2Networks } from '../constants/solana';
import {
  NETWORK_TO_EXPLORER_CLUSTER,
  NETWORK_BLOCK_EXPLORER_URL,
} from '../constants/solana';

export const getTransactionSolanaExplorerUrl = (
  scope: SolanaCaip2Networks,
  signature: string,
): string => {
  const cluster = NETWORK_TO_EXPLORER_CLUSTER[scope];
  return `${NETWORK_BLOCK_EXPLORER_URL}/tx/${signature}${
    cluster ? `?cluster=${cluster}` : ''
  }`;
};
