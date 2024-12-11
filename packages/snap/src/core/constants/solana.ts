/* eslint-disable no-restricted-globals */
export const SOL_SYMBOL = 'SOL';

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

export const NETWORK_BLOCK_EXPLORER_URL = 'https://explorer.solana.com';

export const NETWORK_TO_EXPLORER_CLUSTER = {
  [SolanaCaip2Networks.Mainnet]: undefined,
  [SolanaCaip2Networks.Devnet]: 'devnet',
  [SolanaCaip2Networks.Testnet]: 'testnet',
  [SolanaCaip2Networks.Localnet]: 'local',
};

export enum SolanaInternalRpcMethods {
  StartSendTransactionFlow = 'startSendTransactionFlow',
  ShowTransactionConfirmation = 'showTransactionConfirmation',
}

export const LAMPORTS_PER_SOL = 1_000_000_000;

export enum SolanaCaip19Tokens {
  SOL = 'slip44:501',
}

export type TokenInfo = {
  symbol: string;
  caip19Id: SolanaCaip19Tokens;
  address: string;
  decimals: number; // TODO: Decide if we keep this
};

export const SolanaTokens = {
  [SolanaCaip19Tokens.SOL]: {
    symbol: 'SOL',
    caip19Id: SolanaCaip19Tokens.SOL,
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
} as const satisfies Record<SolanaCaip19Tokens, TokenInfo>;
