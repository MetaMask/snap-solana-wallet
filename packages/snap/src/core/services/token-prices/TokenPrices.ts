/* eslint-disable @typescript-eslint/naming-convention */
import { CaipAssetTypeStruct, type CaipAssetType } from '@metamask/keyring-api';
import type {
  AssetConversion,
  HistoricalPriceIntervals,
  MarketData,
} from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';
import { parseCaipAssetType } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { pick } from 'lodash';

import type { ICache } from '../../caching/ICache';
import { useCache } from '../../caching/useCache';
import type { PriceApiClient } from '../../clients/price-api/PriceApiClient';
import type { SpotPrice } from '../../clients/price-api/types';
import {
  GET_HISTORICAL_PRICES_RESPONSE_NULL_OBJECT,
  VsCurrencyParamStruct,
  type FiatTicker,
} from '../../clients/price-api/types';
import type { Serializable } from '../../serialization/types';
import { isFiat } from '../../utils/isFiat';
import logger, { type ILogger } from '../../utils/logger';
import type { HistoricalPrice } from './types';

export class TokenPricesService {
  readonly #priceApiClient: PriceApiClient;

  readonly #logger: ILogger;

  readonly #cache: ICache<Serializable>;

  readonly #cacheTtlsMilliseconds = {
    historicalPrice: 1000 * 60 * 60, // 1 hour
  };

  constructor(
    priceApiClient: PriceApiClient,
    cache: ICache<Serializable>,
    _logger: ILogger = logger,
  ) {
    this.#priceApiClient = priceApiClient;
    this.#logger = _logger;
    this.#cache = cache;
  }

  /**
   * Extracts the ISO 4217 currency code (aka fiat ticker) from a fiat CAIP-19 asset type.
   *
   * @param caipAssetType - The CAIP-19 asset type.
   * @returns The fiat ticker.
   */
  #extractFiatTicker(caipAssetType: CaipAssetType): FiatTicker {
    if (!isFiat(caipAssetType)) {
      throw new Error('Passed caipAssetType is not a fiat asset');
    }

    const fiatTicker =
      parseCaipAssetType(caipAssetType).assetReference.toLowerCase();

    return fiatTicker as FiatTicker;
  }

  async getMultipleTokenConversions(
    conversions: { from: CaipAssetType; to: CaipAssetType }[],
    includeMarketData = false,
  ): Promise<
    Record<CaipAssetType, Record<CaipAssetType, AssetConversion | null>>
  > {
    if (conversions.length === 0) {
      return {};
    }

    /**
     * `from` and `to` can represent both fiat and crypto assets. For us to get their values
     * the best approach is to use Price API's `getFiatExchangeRates` method for fiat prices,
     * `getMultipleSpotPrices` for crypto prices and then using USD as an intermediate currency
     * to convert the prices to the correct currency.
     */
    const allAssets = conversions.flatMap((conversion) => [
      conversion.from,
      conversion.to,
    ]);
    const cryptoAssets = allAssets.filter((asset) => !isFiat(asset));

    const [fiatExchangeRates, cryptoPrices] = await Promise.all([
      this.#priceApiClient.getFiatExchangeRates(),
      this.#priceApiClient.getMultipleSpotPrices(cryptoAssets, 'usd'),
    ]);

    /**
     * Now that we have the data, convert the `from`s to `to`s.
     *
     * We need to handle the following cases:
     * 1. `from` and `to` are both fiat
     * 2. `from` and `to` are both crypto
     * 3. `from` is fiat and `to` is crypto
     * 4. `from` is crypto and `to` is fiat
     *
     * We also need to keep in mind that although `cryptoPrices` are indexed
     * by CAIP 19 IDs, the `fiatExchangeRates` are indexed by currency symbols.
     * To convert fiat currency symbols to CAIP 19 IDs, we can use the
     * `this.#fiatSymbolToCaip19Id` method.
     */

    const result: Record<
      CaipAssetType,
      Record<CaipAssetType, AssetConversion | null>
    > = {};

    conversions.forEach((conversion) => {
      const { from, to } = conversion;

      if (!result[from]) {
        result[from] = {};
      }

      let fromUsdRate: BigNumber;
      let toUsdRate: BigNumber;

      if (isFiat(from)) {
        /**
         * Beware:
         * We need to invert the fiat exchange rate because exchange rate != spot price
         */
        const fiatExchangeRate =
          fiatExchangeRates[this.#extractFiatTicker(from)]?.value;

        if (!fiatExchangeRate) {
          result[from][to] = null;
          return;
        }

        fromUsdRate = new BigNumber(1).dividedBy(fiatExchangeRate);
      } else {
        fromUsdRate = new BigNumber(cryptoPrices[from]?.price ?? 0);
      }

      if (isFiat(to)) {
        /**
         * Beware:
         * We need to invert the fiat exchange rate because exchange rate != spot price
         */
        const fiatExchangeRate =
          fiatExchangeRates[this.#extractFiatTicker(to)]?.value;

        if (!fiatExchangeRate) {
          result[from][to] = null;
          return;
        }

        toUsdRate = new BigNumber(1).dividedBy(fiatExchangeRate);
      } else {
        toUsdRate = new BigNumber(cryptoPrices[to]?.price ?? 0);
      }

      if (fromUsdRate.isZero() || toUsdRate.isZero()) {
        result[from][to] = null;
        return;
      }

      const rate = fromUsdRate.dividedBy(toUsdRate).toString();

      const marketData =
        includeMarketData && cryptoPrices[from]
          ? this.#computeMarketData(cryptoPrices[from], toUsdRate)
          : undefined;

      result[from][to] = {
        rate,
        conversionTime: Date.now(),
        ...(includeMarketData && marketData ? { marketData } : {}), // Convoluted syntax enforced by TS config 'exactOptionalPropertyTypes: true'
      };
    });

    return result;
  }

  /**
   * Computes the market data object in the target currency.
   *
   * @param spotPrice - The spot price of the asset in source currency.
   * @param rate - The rate to convert the market data to from source currency to target currency.
   * @returns The market data in the target currency.
   */
  #computeMarketData(spotPrice: SpotPrice, rate: BigNumber): MarketData {
    const marketDataInUsd = pick(spotPrice, [
      'marketCap',
      'totalVolume',
      'circulatingSupply',
      'allTimeHigh',
      'allTimeLow',
      'pricePercentChange1h',
      'pricePercentChange1d',
      'pricePercentChange7d',
      'pricePercentChange14d',
      'pricePercentChange30d',
      'pricePercentChange200d',
      'pricePercentChange1y',
    ]);

    const toCurrency = (value: number | null | undefined): string => {
      return value === null || value === undefined
        ? ''
        : new BigNumber(value).dividedBy(rate).toString();
    };

    const includeIfDefined = (
      key: string,
      value: number | null | undefined,
    ) => {
      return value === null || value === undefined ? {} : { [key]: value };
    };

    const marketDataInToCurrency = {
      marketCap: toCurrency(marketDataInUsd.marketCap),
      totalVolume: toCurrency(marketDataInUsd.totalVolume),
      circulatingSupply: (marketDataInUsd.circulatingSupply ?? 0).toString(), // Circulating supply counts the number of tokens in circulation, so we don't convert
      allTimeHigh: toCurrency(marketDataInUsd.allTimeHigh),
      allTimeLow: toCurrency(marketDataInUsd.allTimeLow),
      // Variations in percent don't need to be converted, they are independent of the currency
      pricePercentChange: {
        ...includeIfDefined('PT1H', marketDataInUsd.pricePercentChange1h),
        ...includeIfDefined('P1D', marketDataInUsd.pricePercentChange1d),
        ...includeIfDefined('P7D', marketDataInUsd.pricePercentChange7d),
        ...includeIfDefined('P14D', marketDataInUsd.pricePercentChange14d),
        ...includeIfDefined('P30D', marketDataInUsd.pricePercentChange30d),
        ...includeIfDefined('P200D', marketDataInUsd.pricePercentChange200d),
        ...includeIfDefined('P1Y', marketDataInUsd.pricePercentChange1y),
      },
    };

    return marketDataInToCurrency;
  }

  async #getHistoricalPrice_INTERNAL(
    from: CaipAssetType,
    to: CaipAssetType,
  ): Promise<HistoricalPrice> {
    assert(from, CaipAssetTypeStruct);
    assert(to, CaipAssetTypeStruct);

    const toTicker = parseCaipAssetType(to).assetReference.toLowerCase();
    assert(toTicker, VsCurrencyParamStruct);

    const timePeriodsToFetch = ['1d', '7d', '1m', '3m', '1y'];

    // For each time period, call the Price API to fetch the historical prices
    const promises = timePeriodsToFetch.map(async (timePeriod) =>
      this.#priceApiClient
        .getHistoricalPrices({
          assetType: from,
          timePeriod,
          vsCurrency: toTicker,
        })
        // Wrap the response in an object with the time period and the response for easier reducing
        .then((response) => ({
          timePeriod,
          response,
        }))
        // Gracefully handle individual errors to avoid breaking the entire operation
        .catch((error) => {
          this.#logger.warn(
            `Error fetching historical prices for ${from} to ${to} with time period ${timePeriod}. Returning null object.`,
            error,
          );
          return {
            timePeriod,
            response: GET_HISTORICAL_PRICES_RESPONSE_NULL_OBJECT,
          };
        }),
    );

    const wrappedHistoricalPrices = await Promise.all(promises);

    const intervals = wrappedHistoricalPrices.reduce<HistoricalPriceIntervals>(
      (acc, { timePeriod, response }) => {
        const iso8601Interval = `P${timePeriod.toUpperCase()}`;
        acc[iso8601Interval] = response.prices.map((price) => [
          price[0],
          price[1].toString(),
        ]);
        return acc;
      },
      {},
    );

    const now = Date.now();

    const result: HistoricalPrice = {
      intervals,
      updateTime: now,
      expirationTime: now + this.#cacheTtlsMilliseconds.historicalPrice,
    };

    return result;
  }

  /**
   * Get the historical price of an asset pair.
   * It caches the results for 1 hour.
   *
   * @param from - The CAIP-19 ID of the asset to convert from.
   * @param to - The CAIP-19 ID of the asset to convert to. Must be one of the supported Price API `vsCurrency` in endpoint [`getHistoricalPricesByCaipAssetId`](https://price.uat-api.cx.metamask.io/docs#/Historical%20Prices/PriceController_getHistoricalPricesByCaipAssetId).
   * @returns The historical price of the asset pair.
   * @throws If the `from` asset is not a valid CAIP-19 ID.
   * @throws If the `to` asset is not a valid CAIP-19 ID.
   * @throws If the `to` asset is not one of the supported Price API `vsCurrency`.
   */
  async getHistoricalPrice(
    from: CaipAssetType,
    to: CaipAssetType,
  ): Promise<HistoricalPrice> {
    return useCache(this.#getHistoricalPrice_INTERNAL.bind(this), this.#cache, {
      functionName: 'TokenPricesService:getHistoricalPrice',
      ttlMilliseconds: this.#cacheTtlsMilliseconds.historicalPrice,
    })(from, to);
  }
}
