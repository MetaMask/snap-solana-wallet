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

  const cleanBaseUrl = baseUrl.split('?')[0];

  const txUrl = `${cleanBaseUrl}/tx/${signature}`;

  if (scope !== SolanaCaip2Networks.Mainnet) {
    const cluster = scope === SolanaCaip2Networks.Devnet ? 'devnet' : 'testnet';
    return `${txUrl}?cluster=${cluster}`;
  }

  return txUrl;
};
