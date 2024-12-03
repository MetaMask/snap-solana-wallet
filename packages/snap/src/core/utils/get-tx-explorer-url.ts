import {
  SolanaCaip2Networks,
  NETWORK_BLOCK_EXPLORER_URL_MAP,
} from '../constants/solana';

export const getTransactionSolanaExplorerUrl = (
  scope: SolanaCaip2Networks,
  signature: string,
): string => {
  const baseUrl =
    NETWORK_BLOCK_EXPLORER_URL_MAP[scope] ??
    NETWORK_BLOCK_EXPLORER_URL_MAP[SolanaCaip2Networks.Mainnet];

  const [urlBase, queryParams] = baseUrl.split('?');

  const cleanBase = urlBase?.replace(/\/+$/u, '');
  return queryParams
    ? `${cleanBase}/tx/${signature}?${queryParams}`
    : `${cleanBase}/tx/${signature}`;
};
