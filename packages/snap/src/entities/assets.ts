import type {
  NativeCaipAssetType,
  Network,
  NftCaipAssetType,
  TokenCaipAssetType,
} from '../core/constants/solana';

export type NativeAsset = {
  assetType: NativeCaipAssetType;
  keyringAccountId: string;
  network: Network;
  address: string;
  symbol: string;
  decimals: number;
  rawAmount: string; // Without decimals
  uiAmount: string; // With decimals
};

export type TokenAsset = {
  assetType: TokenCaipAssetType; // Using the mint
  keyringAccountId: string;
  network: Network;
  mint: string;
  pubkey: string;
  symbol: string;
  decimals: number;
  multiplier: string; // "1" by default. Some tokens might use a different value (can also vary over time), convenient for representing yield bearing assets, dividends, stock splits, etc.
  rawAmount: string; // Without decimals nor multiplier
  uiAmount: string; // With decimals and multiplier
};

export type NftAsset = {
  assetType: NftCaipAssetType;
  keyringAccountId: string;
  network: Network;
  mint: string;
  pubkey: string;
  symbol: string;
  rawAmount: string; // Without decimals
  uiAmount: string; // With decimals
};

export type AssetEntity = NativeAsset | TokenAsset | NftAsset;
