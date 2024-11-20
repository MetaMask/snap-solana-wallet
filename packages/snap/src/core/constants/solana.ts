export const SOL_SYMBOL = 'SOL';

/**
 * Solana CAIP-2 Networks
 * @see https://namespaces.chainagnostic.org/solana/caip2
 */
export enum SolanaCaip2Networks {
  Mainnet = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  Devnet = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  Testnet = 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
}

export enum SolanaCaip19Tokens {
  SOL = 'slip44:501',
}

export enum SolanaInternalRpcMethods {
  StartSendTransactionFlow = 'startSendTransactionFlow',
}

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const SOLANA_NETWORK_TO_RPC_URLS: Record<SolanaCaip2Networks, string> = {
  [SolanaCaip2Networks.Mainnet]: 'https://api.mainnet-beta.solana.com',
  [SolanaCaip2Networks.Devnet]: 'https://api.devnet.solana.com',
  [SolanaCaip2Networks.Testnet]: 'https://api.testnet.solana.com',
};
