/* eslint-disable @typescript-eslint/naming-convention */
import type { FungibleAssetMetadata } from '@metamask/snaps-sdk';

import type { AssetEntity, NativeAsset, TokenAsset } from '../../../entities';
import { KnownCaip19Id, Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from './solana-keyring-accounts';

export const MOCK_ASSET_ENTITY_0: NativeAsset = {
  assetType: KnownCaip19Id.SolMainnet,
  keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
  network: Network.Mainnet,
  address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
  symbol: 'SOL',
  decimals: 9,
  rawAmount: '1000000000',
  uiAmount: '1',
};

export const MOCK_ASSET_ENTITY_1: TokenAsset = {
  assetType: KnownCaip19Id.UsdcMainnet,
  keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
  network: Network.Mainnet,
  symbol: 'USDC',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  pubkey: '9wt9PfjPD3JCy5r7o4K1cTGiuTG7fq2pQhdDCdQALKjg',
  decimals: 6,
  rawAmount: '123456789',
  uiAmount: '123.456789',
};

export const MOCK_ASSET_ENTITY_2: TokenAsset = {
  assetType: KnownCaip19Id.Ai16zMainnet,
  keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
  network: Network.Mainnet,
  symbol: 'AI16Z',
  mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
  pubkey: 'DJGpJufSnVDriDczovhcQRyxamKtt87PHQ7TJEcVB6ta',
  decimals: 9,
  rawAmount: '987654321',
  uiAmount: '987.654321',
};

export const MOCK_ASSET_ENTITIES: AssetEntity[] = [
  MOCK_ASSET_ENTITY_0,
  MOCK_ASSET_ENTITY_1,
  MOCK_ASSET_ENTITY_2,
];

export const SOLANA_MOCK_TOKEN_METADATA: Record<string, FungibleAssetMetadata> =
  {
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
    [KnownCaip19Id.UsdcMainnet]: {
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
    [KnownCaip19Id.Ai16zMainnet]: {
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
