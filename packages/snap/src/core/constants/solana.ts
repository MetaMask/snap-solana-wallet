import { address } from '@solana/kit';

/* eslint-disable no-restricted-globals */
export const SOL_SYMBOL = 'SOL';
export const SOL_IMAGE_URL =
  'https://uat-static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png';
export const LAMPORTS_PER_SOL = 1_000_000_000;
export const MICRO_LAMPORTS_PER_LAMPORT = 1_000_000;
export const DEFAULT_NETWORK_BLOCK_EXPLORER_URL = 'https://solscan.io';

/**
 * Solana CAIP-2 Networks
 * @see https://namespaces.chainagnostic.org/solana/caip2
 */
export enum Network {
  Mainnet = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  Devnet = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  Testnet = 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
  Localnet = 'solana:123456789abcdef',
}

export enum KnownCaip19Id {
  SolMainnet = `${Network.Mainnet}/slip44:501`,
  SolDevnet = `${Network.Devnet}/slip44:501`,
  SolTestnet = `${Network.Testnet}/slip44:501`,
  SolLocalnet = `${Network.Localnet}/slip44:501`,
  UsdcMainnet = `${Network.Mainnet}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
  UsdcDevnet = `${Network.Devnet}/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`,
  UsdcLocalnet = `${Network.Localnet}/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`,
  EurcMainnet = `${Network.Mainnet}/token:HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr`,
  EurcDevnet = `${Network.Devnet}/token:HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr`,
  EurcLocalnet = `${Network.Localnet}/token:HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr`,
}

export const NETWORK_TO_EXPLORER_CLUSTER = {
  [Network.Mainnet]: undefined,
  [Network.Devnet]: 'devnet',
  [Network.Testnet]: 'testnet',
  [Network.Localnet]: 'local',
};

export enum SolanaCaip19Tokens {
  SOL = 'slip44:501',
}

export type TokenInfo = {
  symbol: string;
  caip19Id: KnownCaip19Id;
  address: string;
  decimals: number;
};

export const TokenMetadata = {
  [KnownCaip19Id.SolMainnet]: {
    symbol: 'SOL',
    caip19Id: KnownCaip19Id.SolMainnet,
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
  [KnownCaip19Id.SolDevnet]: {
    symbol: 'SOL',
    caip19Id: KnownCaip19Id.SolDevnet,
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
  [KnownCaip19Id.SolTestnet]: {
    symbol: 'SOL',
    caip19Id: KnownCaip19Id.SolTestnet,
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
  [KnownCaip19Id.SolLocalnet]: {
    symbol: 'SOL',
    caip19Id: KnownCaip19Id.SolLocalnet,
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
  [KnownCaip19Id.UsdcMainnet]: {
    symbol: 'USDC',
    caip19Id: KnownCaip19Id.UsdcMainnet,
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
  },
  [KnownCaip19Id.UsdcDevnet]: {
    symbol: 'USDC',
    caip19Id: KnownCaip19Id.UsdcDevnet,
    address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    decimals: 6,
  },
  [KnownCaip19Id.UsdcLocalnet]: {
    symbol: 'USDC',
    caip19Id: KnownCaip19Id.UsdcLocalnet,
    address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    decimals: 6,
  },
} as const;

export const SOL_TRANSFER_FEE_LAMPORTS = 5000;

export const TOKEN_PROGRAM_ID = address(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

export const TOKEN_2022_PROGRAM_ID = address(
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
);

export const Networks = {
  [Network.Mainnet]: {
    caip2Id: Network.Mainnet,
    cluster: 'mainnet',
    name: 'Solana Mainnet',
    nativeToken: TokenMetadata[KnownCaip19Id.SolMainnet],
  },
  [Network.Devnet]: {
    caip2Id: Network.Devnet,
    cluster: 'devnet',
    name: 'Solana Devnet',
    nativeToken: TokenMetadata[KnownCaip19Id.SolDevnet],
  },
  [Network.Testnet]: {
    caip2Id: Network.Testnet,
    cluster: 'testnet',
    name: 'Solana Testnet',
    nativeToken: TokenMetadata[KnownCaip19Id.SolTestnet],
  },
  [Network.Localnet]: {
    caip2Id: Network.Localnet,
    cluster: 'local',
    name: 'Solana Localnet',
    nativeToken: TokenMetadata[KnownCaip19Id.SolLocalnet],
  },
} as const;

export type Caip10Address = `${Network}:${string}`;
