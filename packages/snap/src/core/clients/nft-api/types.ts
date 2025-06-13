/* eslint-disable @typescript-eslint/naming-convention */
export type PaginatedResponse<Type> = {
  cursor: string | null;
  error: string | null;
  items: Type[];
};

/**
 * Raw NFT API responses
 */

export type NftApiItemType = {
  address: string;
  token_id: string | null;
  token_standard: string | null;
  name: string;
  description: string;
  metadata: string | null;
  image_url: string;
  media_url: string | null;
  external_url: string;
  attributes: {
    key: string;
    value: string;
  }[];
  token_account_address: string | null;
  creators: {
    address: string;
    share: number;
    verified: number;
  }[];
  collection_name: string;
  collection_symbol: string;
  collection_count: number;
  collection_image_url: string | null;
  onchain_collection_address: string | null;
  floor_price: {
    asset: {
      type: string;
      name: string;
      symbol: string;
      decimals: number;
      token_id: string;
    };
    amount: {
      raw_amount: string;
      amount: number;
    };
  } | null;
  last_sale_price: {
    asset: {
      type: string;
      name: string;
      symbol: string;
      decimals: number;
      token_id: string;
    };
    amount: {
      raw_amount: string;
      amount: number;
    };
  } | null;
  rarity: {
    ranking: {
      source: string;
      value: number;
    };
    metadata: {
      howrare: {
        rank: number;
      };
      moonrank: {
        rank: number;
      };
    };
  } | null;
};

export type NftApiBalanceType = {
  chain: string;
  address: string;
  token_address: string;
  token_id: string | null;
  balance: number;
  acquired_at: string | null;
  isSpam: boolean;
  nft_token: NftApiItemType;
};

/**
 * Mapped NFT API responses
 */

export type Nft = {
  address: string;
  tokenId: string | null;
  tokenStandard: string | null;
  name: string;
  description: string;
  metadata: string | null;
  imageUrl: string;
  mediaUrl: string | null;
  externalUrl: string;
  attributes: {
    key: string;
    value: string;
  }[];
  tokenAccountAddress: string | null;
  creators: {
    address: string;
    share: number;
    verified: number;
  }[];
  collectionName: string;
  collectionSymbol: string;
  collectionCount: number;
  collectionImageUrl: string | null;
  onchainCollectionAddress: string | null;
  floorPrice: {
    asset: {
      type: string;
      name: string;
      symbol: string;
      decimals: number;
      tokenId: string;
    };
    amount: {
      rawAmount: string;
      amount: number;
    };
  } | null;
  lastSalePrice: {
    asset: {
      type: string;
      name: string;
      symbol: string;
      decimals: number;
      tokenId: string;
    };
    amount: {
      rawAmount: string;
      amount: number;
    };
  } | null;
  rarity: {
    ranking: {
      source: string;
      value: number;
    };
    metadata: {
      howrare: {
        rank: number;
      };
      moonrank: {
        rank: number;
      };
    };
  } | null;
};

export type Balance = {
  chain: string;
  address: string;
  tokenAddress: string;
  tokenId: string | null;
  balance: number;
  acquiredAt: string | null;
  isSpam: boolean;
  nftToken: Nft;
};
