import type { FungibleAssetMetadata } from '@metamask/snaps-sdk';

import type { Caip10Address } from '../../constants/solana';

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

export type AssetMetadata = FungibleAssetMetadata | NonFungibleAssetMetadata;
