/* eslint-disable no-restricted-globals */
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import type { SpotPrice } from './types';

export class PriceApiClient {
  readonly #baseUrl = 'https://price-api.metamask-institutional.io';

  readonly #fetch: typeof globalThis.fetch;

  readonly #logger: ILogger;

  constructor(
    _fetch: typeof globalThis.fetch = globalThis.fetch,
    _logger: ILogger = logger,
  ) {
    this.#fetch = _fetch;
    this.#logger = _logger;
  }

  /**
   * Get spot price for a token given its chain ID in CAIP-2 format and address.
   *
   * @param chainIdInCaip2 - Chain ID in CAIP-2 format.
   * @param tokenAddress - Contract address of token to get price for.
   * @param vsCurrency - Currency to convert prices to, default is USD.
   * @returns The spot price.
   */
  async getSpotPrice(
    chainIdInCaip2: string,
    tokenAddress: string,
    vsCurrency = 'usd',
  ): Promise<SpotPrice> {
    try {
      const response = await this.#fetch(
        `${
          this.#baseUrl
        }/v2/chains/${chainIdInCaip2}/spot-prices/${tokenAddress}?vsCurrency=${vsCurrency}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.#logger.error(error, 'Error fetching spot prices:');
      throw error;
    }
  }
}
