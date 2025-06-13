import { type CaipAssetType } from '@metamask/keyring-api';

import type { Caip10Address } from '../../constants/solana';

// FIXME: These types should come from the updated Keyring API package.
// THIS CODE SHOULD BE REMOVED BEFORE THIS PR IS MERGED !!!

export type AssetMetadata = FungibleAssetMetadata | NonFungibleAssetMetadata;

export type OnAssetsLookupResponse = {
  assets: Record<CaipAssetType, AssetMetadata | null>;
};

/**
 * FUNGIBLE ASSET TYPES
 */

// Represents an asset unit.
export type FungibleAssetUnit = {
  // Human-friendly name of the asset unit.
  name: string;

  // Ticker symbol of the asset unit.
  symbol: string;

  // Number of decimals of the asset unit.
  decimals: number;
};

// Fungible asset metadata.
export type FungibleAssetMetadata = {
  // Human-friendly name of the asset.
  name?: string;

  // Ticker symbol of the asset's main unit.
  symbol?: string;

  // Represents a fungible asset
  fungible: true;

  // Base64 data URI or URL representation of the asset icon.
  iconUrl: string;

  // List of asset units.
  units: FungibleAssetUnit[];
};

export type FungibleAssetMarketData = {
  // Represents a fungible asset market data.
  fungible: true;

  // The market cap of the asset represented as a decimal number in a string.
  marketCap?: string;

  // The total volume of the asset represented as a decimal number in a string.
  totalVolume?: string;

  // The circulating supply of the asset represented as a decimal number in a string.
  circulatingSupply?: string;

  // The all time high of the asset represented as a decimal number in a string.
  allTimeHigh?: string;

  // The all time low of the asset represented as a decimal number in a string.
  allTimeLow?: string;

  pricePercentChange?: {
    // The `all` value is a special interval that represents all available data.
    all?: number;

    // The interval key MUST follow the ISO 8601 duration format.
    [interval: string]: number;
  };
};

/**
 * NON-FUNGIBLE ASSET TYPES
 */

export type NonFungibleAssetCollection = {
  // Human-friendly name of the asset collection.
  name: string;

  // The collection address.
  address: Caip10Address;

  // Ticker symbol of the asset collection.
  symbol: string;

  // The number of tokens in the collection.
  tokenCount?: number;

  // The creator address of the asset.
  creator?: Caip10Address;

  // Base64 data URI or URL representation of the asset icon.
  imageUrl?: string;
};

export type NonFungibleAssetMetadata = {
  // Human-friendly name of the asset.
  name?: string;

  // Ticker symbol of the asset.
  symbol?: string;

  // Base64 data URI or URL representation of the asset image.
  imageUrl?: string;

  // The description of the asset.
  description?: string;

  // Represents a non-fungible asset
  fungible: false;

  // The time at which the asset was acquired.
  // The time is represented as a UNIX timestamp.
  acquiredAt?: number;

  // Indicates whether the asset is possibly a spam asset.
  isPossibleSpam?: boolean;

  // Attributes of the non-fungible asset.
  attributes?: Record<string, string | number>;

  // The collection of the asset.
  collection?: NonFungibleAssetCollection;
};

export type NonFungibleAssetMarketData = {
  // Represents a non-fungible asset market data.
  fungible: false;

  // The last sale of one asset in the collection.
  lastSale?: {
    // The asset that was sold.
    asset: CaipAssetType;
    // The price at which is was sold represented as a decimal number in a string.
    amount: string;
  };

  // The top bid on the asset.
  topBid?: {
    // The asset that was sold.
    asset: CaipAssetType;
    // The price at which is was sold represented as a decimal number in a string.
    amount: string;
  };

  // The floor price of the collection.
  floorPrice?: {
    // The asset that is used to represent the floor price.
    asset: CaipAssetType;
    // The price of the asset represented as a decimal number in a string.
    amount: string;
  };

  // The rarity of the asset and its metadata.
  rarity?: {
    ranking?: {
      source: string;
      rank: number;
    };

    metadata?: Record<string, number>;
  };
};
