/* eslint-disable @typescript-eslint/naming-convention */
import type { CaipAssetType } from '@metamask/utils';
import { TOKEN_PROGRAM_ADDRESS, type Mint } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import type { Account } from '@solana/kit';
import { address, lamports } from '@solana/kit';

import type { SolanaTokenMetadata } from '../../clients/token-metadata-client/types';
import { KnownCaip19Id, Network } from '../../constants/solana';
import type { SolanaAsset } from '../../types/solana';

export const SOLANA_MOCK_TOKEN: SolanaAsset = {
  scope: Network.Localnet,
  assetType: KnownCaip19Id.SolLocalnet,
  balance: '123456789',
  decimals: 9,
  native: true,
};

export const SOLANA_MOCK_SPL_TOKENS: SolanaAsset[] = [
  {
    scope: Network.Localnet,
    assetType: KnownCaip19Id.UsdcLocalnet,
    balance: '123456789',
    decimals: 6,
    native: false,
  },
  {
    scope: Network.Localnet,
    assetType: KnownCaip19Id.Ai16zLocalnet,
    balance: '987654321',
    decimals: 9,
    native: false,
  },
];

export const SOLANA_MOCK_TOKEN_METADATA: Record<string, SolanaTokenMetadata> = {
  [KnownCaip19Id.SolLocalnet]: {
    iconUrl:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/sol/logo.png',
    name: 'Solana',
    symbol: 'SOL',
    fungible: true,
    units: [
      {
        decimals: 9,
        name: 'Solana',
        symbol: 'SOL',
      },
    ],
  },
  [KnownCaip19Id.UsdcLocalnet]: {
    iconUrl:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    name: 'USDC',
    symbol: 'USDC',
    fungible: true,
    units: [
      {
        decimals: 6,
        name: 'USDC',
        symbol: 'USDC',
      },
    ],
  },
  [KnownCaip19Id.Ai16zLocalnet]: {
    iconUrl:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC/logo.png',
    name: 'ai16z',
    symbol: 'AI16Z',
    fungible: true,
    units: [
      {
        decimals: 9,
        name: 'ai16z',
        symbol: 'AI16Z',
      },
    ],
  },
};

// Sample responses from fetchMint method, exported by @solana-program/token
export const MOCK_FETCH_MINT_RESPONSES: Record<CaipAssetType, Account<Mint>> = {
  [KnownCaip19Id.UsdcLocalnet]: {
    executable: false,
    lamports: lamports(390030797122n),
    programAddress: TOKEN_PROGRAM_ADDRESS,
    space: 82n,
    address: address('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // Localnet USDC
    data: {
      mintAuthority: {
        __option: 'Some',
        value: address('BJE5MMbqXjVwjAF7oxwPYXnTXDyspzZyt4vwenNw5ruG'),
      },
      supply: 9011200678169477n,
      decimals: 6,
      isInitialized: true,
      freezeAuthority: {
        __option: 'Some',
        value: address('7dGbd2QZcCKcTndnHcTL8q7SMVXAkp688NTQYwrRCrar'),
      },
    },
  },
  [KnownCaip19Id.Ai16zLocalnet]: {
    executable: false,
    lamports: lamports(18364570235n),
    programAddress: TOKEN_2022_PROGRAM_ADDRESS,
    space: 408n,
    address: address('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'), // Localnet ai16z
    data: {
      mintAuthority: {
        __option: 'Some',
        value: address('AZtt8LUScEAG74iKnPNRuYgQhwmGJhAf6yUkAXjAd8sp'),
      },
      supply: 1099998595821532811n,
      decimals: 9,
      isInitialized: true,
      freezeAuthority: { __option: 'None' },
    },
  },
} as const;
