/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import { assert } from '@metamask/superstruct';

import type { ICache } from '../../caching/ICache';
import { useCache } from '../../caching/useCache';
import type { Serializable } from '../../serialization/types';
import type { ConfigProvider } from '../../services/config';
import { buildUrl } from '../../utils/buildUrl';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { UrlStruct } from '../../validation/structs';
import type {
  Balance,
  Nft,
  NftApiBalanceType,
  NftApiItemType,
  PaginatedResponse,
} from './types';

export class NftApiClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #logger: ILogger;

  readonly #baseUrl: string;

  readonly #cache: ICache<Serializable>;

  readonly #cacheTtlsMilliseconds: {
    listAddressSolanaNfts: number;
    getNftMetadata: number;
  };

  constructor(
    configProvider: ConfigProvider,
    _cache: ICache<Serializable>,
    _fetch: typeof globalThis.fetch = globalThis.fetch,
    _logger: ILogger = logger,
  ) {
    const { baseUrl, cacheTtlsMilliseconds } = configProvider.get().nftApi;

    assert(baseUrl, UrlStruct);

    this.#fetch = _fetch;
    this.#logger = _logger;
    this.#baseUrl = baseUrl;
    this.#cacheTtlsMilliseconds = cacheTtlsMilliseconds;

    this.#cache = _cache;
  }

  #mapListAddressSolanaNftsResponse(
    data: PaginatedResponse<NftApiBalanceType>,
  ): PaginatedResponse<Balance> {
    return {
      cursor: data.cursor,
      error: data.error,
      items: data.items.map((item) => ({
        chain: item.chain,
        address: item.address,
        tokenAddress: item.token_address,
        tokenId: item.token_id,
        balance: item.balance,
        acquiredAt: item.acquired_at,
        isSpam: item.isSpam,
        nftToken: this.#mapGetNftMetadataResponse(item.nft_token),
      })),
    };
  }

  async #listAddressSolanaNfts_INTERNAL(address: string) {
    let allItems: Balance[] = [];
    let currentCursor: string | undefined;

    do {
      const url = buildUrl({
        baseUrl: this.#baseUrl,
        path: `/users/${address}/solana-tokens`,
        queryParams: currentCursor ? { cursor: currentCursor } : undefined,
      });
      const response = await this.#fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          version: '1',
        },
      });
      const data = await response.json();

      const mappedData = this.#mapListAddressSolanaNftsResponse(data);

      allItems = [...allItems, ...mappedData.items];
      currentCursor = mappedData.cursor ?? undefined;
    } while (currentCursor);

    return allItems;
  }

  async listAddressSolanaNfts(address: string) {
    return useCache(
      this.#listAddressSolanaNfts_INTERNAL.bind(this),
      this.#cache,
      {
        functionName: 'NftApiClient:listAddressSolanaNfts',
        ttlMilliseconds: this.#cacheTtlsMilliseconds.listAddressSolanaNfts,
      },
    )(address);
  }

  #mapGetNftMetadataResponse(data: NftApiItemType): Nft {
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

  async #getNftMetadata_INTERNAL(tokenAddress: string) {
    try {
      const url = buildUrl({
        baseUrl: this.#baseUrl,
        path: `/nfts/contracts/solana/${tokenAddress}/1`,
      });
      const response = await this.#fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          version: '1',
        },
      });
      const data = await response.json();

      const mappedData = this.#mapGetNftMetadataResponse(data);

      return mappedData;
    } catch (error) {
      return null;
    }
  }

  async getNftMetadata(tokenAddress: string) {
    return useCache(this.#getNftMetadata_INTERNAL.bind(this), this.#cache, {
      functionName: 'NftApiClient:getNftMetadata',
      ttlMilliseconds: this.#cacheTtlsMilliseconds.getNftMetadata,
    })(tokenAddress);
  }

  async getNftsMetadata(tokenAddresses: string[]) {
    const nftsMetadata = await Promise.all(
      tokenAddresses.map(async (tokenAddress) =>
        this.getNftMetadata(tokenAddress),
      ),
    );

    return nftsMetadata;
  }
}
