import type { Nft, NftApiItemType } from '../types';

/**
 * Maps NFT API's snake case to camel case.
 * @param data - The response from the NFT API.
 * @returns The mapped Nft type.
 */
export function mapGetNftMetadataResponse(data: NftApiItemType): Nft {
  return {
    address: data.address,
    tokenId: data.token_id,
    tokenStandard: data.token_standard,
    name: data.name,
    description: data.description,
    metadata: data.metadata,
    imageUrl: data.image_url,
    mediaUrl: data.media_url,
    externalUrl: data.external_url,
    attributes: data.attributes.map((attribute) => ({
      key: attribute.key,
      value: attribute.value,
    })),
    tokenAccountAddress: data.token_account_address,
    creators: data.creators.map((creator) => ({
      address: creator.address,
      share: creator.share,
      verified: creator.verified,
    })),
    collectionName: data.collection_name,
    collectionSymbol: data.collection_symbol,
    collectionCount: data.collection_count,
    collectionImageUrl: data.collection_image_url,
    onchainCollectionAddress: data.onchain_collection_address,
    floorPrice: data.floor_price
      ? {
          asset: {
            type: data.floor_price.asset.type,
            name: data.floor_price.asset.name,
            symbol: data.floor_price.asset.symbol,
            decimals: data.floor_price.asset.decimals,
            tokenId: data.floor_price.asset.token_id,
          },
          amount: {
            rawAmount: data.floor_price.amount.raw_amount,
            amount: data.floor_price.amount.amount,
          },
        }
      : null,
    lastSalePrice: data.last_sale_price
      ? {
          asset: {
            type: data.last_sale_price.asset.type,
            name: data.last_sale_price.asset.name,
            symbol: data.last_sale_price.asset.symbol,
            decimals: data.last_sale_price.asset.decimals,
            tokenId: data.last_sale_price.asset.token_id,
          },
          amount: {
            rawAmount: data.last_sale_price.amount.raw_amount,
            amount: data.last_sale_price.amount.amount,
          },
        }
      : null,
    rarity: data.rarity
      ? {
          ranking: {
            source: data.rarity.ranking.source,
            value: data.rarity.ranking.value,
          },
          metadata: {
            howrare: {
              rank: data.rarity.metadata.howrare.rank,
            },
            moonrank: {
              rank: data.rarity.metadata.moonrank.rank,
            },
          },
        }
      : null,
  };
}
