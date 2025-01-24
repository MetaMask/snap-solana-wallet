import type { SolanaTokenMetadata } from '../../clients/token-metadata-client/types';
import { Network, SolanaCaip19Tokens } from '../../constants/solana';
import type { SolanaAsset } from '../../types/solana';

export const SOLANA_MOCK_TOKEN: SolanaAsset = {
  scope: Network.Localnet,
  address: `${Network.Localnet}/${SolanaCaip19Tokens.SOL}`,
  balance: '123456789',
  decimals: 9,
  native: true,
};

export const SOLANA_MOCK_SPL_TOKENS: SolanaAsset[] = [
  {
    scope: Network.Localnet,
    address: `${Network.Localnet}/token:address1`,
    balance: '123456789',
    decimals: 9,
    native: false,
  },
  {
    scope: Network.Localnet,
    address: `${Network.Localnet}/token:address2`,
    balance: '987654321',
    decimals: 9,
    native: false,
  },
];

export const SOLANA_MOCK_TOKEN_METADATA: Record<string, SolanaTokenMetadata> = {
  [SOLANA_MOCK_TOKEN.address]: {
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
  [`${Network.Localnet}/token:address1`]: {
    iconUrl:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/address1/logo.png',
    name: 'Mock Token 1',
    symbol: 'MOCK1',
    fungible: true,
    units: [
      {
        decimals: 9,
        name: 'Mock Token 1',
        symbol: 'MOCK1',
      },
    ],
  },
  [`${Network.Localnet}/token:address2`]: {
    iconUrl:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/address2/logo.png',
    name: 'Mock Token 2',
    symbol: 'MOCK2',
    fungible: true,
    units: [
      {
        decimals: 9,
        name: 'Mock Token 2',
        symbol: 'MOCK2',
      },
    ],
  },
};
