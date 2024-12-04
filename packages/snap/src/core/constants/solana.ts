/* eslint-disable no-restricted-globals */
export const SOL_SYMBOL = 'SOL';

export const Networks = {
  Mainnet: {
    id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    cluster: 'Mainnet',
    name: 'Solana Mainnet',
    rpcUrl: process.env.RPC_URL_MAINNET ?? '',
  },
  Devnet: {
    id: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    cluster: 'Devnet',
    name: 'Solana Devnet',
    rpcUrl: process.env.RPC_URL_DEVNET ?? '',
  },
  Testnet: {
    id: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
    cluster: 'Testnet',
    name: 'Solana Testnet',
    rpcUrl: process.env.RPC_URL_TESTNET ?? '',
  },
  Localnet: {
    id: 'solana:123456789abcdef',
    cluster: 'Localnet',
    name: 'Solana Localnet',
    rpcUrl: process.env.RPC_URL_LOCALNET ?? '',
  },
};

/**
 * Solana CAIP-2 Networks
 * @see https://namespaces.chainagnostic.org/solana/caip2
 */
export enum SolanaCaip2Networks {
  Mainnet = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  Devnet = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  Testnet = 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
  Localnet = 'solana:123456789abcdef',
}

export const SolanaNetworksNames: Record<SolanaCaip2Networks, string> = {
  [SolanaCaip2Networks.Mainnet]: 'Solana Mainnet',
  [SolanaCaip2Networks.Devnet]: 'Solana Devnet',
  [SolanaCaip2Networks.Testnet]: 'Solana Testnet',
  [SolanaCaip2Networks.Localnet]: 'Solana Localnet',
};

export enum SolanaCaip19Tokens {
  SOL = 'slip44:501',
}

export enum SolanaInternalRpcMethods {
  StartSendTransactionFlow = 'startSendTransactionFlow',
  ShowTransactionConfirmation = 'showTransactionConfirmation',
}

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const SOLANA_NETWORK_TO_RPC_URLS: Record<SolanaCaip2Networks, string> = {
  [SolanaCaip2Networks.Mainnet]: process.env.RPC_URL_MAINNET ?? '',
  [SolanaCaip2Networks.Devnet]: process.env.RPC_URL_DEVNET ?? '',
  [SolanaCaip2Networks.Testnet]: process.env.RPC_URL_TESTNET ?? '',
  [SolanaCaip2Networks.Localnet]: process.env.RPC_URL_LOCALNET ?? '',
};
