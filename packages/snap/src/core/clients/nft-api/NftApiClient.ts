/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import { assert } from '@metamask/superstruct';
import { Duration } from '@metamask/utils';

import type { ICache } from '../../caching/ICache';
import type { Serializable } from '../../serialization/types';
import type { ConfigProvider } from '../../services/config';
import { buildUrl } from '../../utils/buildUrl';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { UrlStruct } from '../../validation/structs';
import type { Balance } from './types';
import { mapGetNftMetadataResponse } from './utils/mapGetNftMetadataResponse';
import { mapListAddressSolanaNftsResponse } from './utils/mapListAddressSolanaNftsResponse';

export class NftApiClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #logger: ILogger;

  readonly #baseUrl: string;

  readonly #cache: ICache<Serializable>;

  public static readonly cacheTtlsMilliseconds = {
    fiatExchangeRates: Duration.Minute,
    spotPrices: Duration.Minute,
    historicalPrices: Duration.Minute,
  };

  constructor(
    configProvider: ConfigProvider,
    _cache: ICache<Serializable>,
    _fetch: typeof globalThis.fetch = globalThis.fetch,
    _logger: ILogger = logger,
  ) {
    const { baseUrl } = configProvider.get().nftApi;

    assert(baseUrl, UrlStruct);

    this.#fetch = _fetch;
    this.#logger = _logger;
    this.#baseUrl = baseUrl;

    this.#cache = _cache;
  }

  async listAddressSolanaNfts(address: string) {
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

      const mappedData = mapListAddressSolanaNftsResponse(data);

      allItems = [...allItems, ...mappedData.items];
      currentCursor = mappedData.cursor ?? undefined;
    } while (currentCursor);

    return allItems;
  }

  async getNftMetadata(tokenAddress: string) {
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

      const mappedData = mapGetNftMetadataResponse(data);

      return mappedData;
    } catch (error) {
      return null;
    }
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
