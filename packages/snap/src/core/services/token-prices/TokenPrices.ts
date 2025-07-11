/* eslint-disable @typescript-eslint/naming-convention */
import { CaipAssetTypeStruct, type CaipAssetType } from '@metamask/keyring-api';
import type {
  AssetConversion,
  FungibleAssetMarketData,
  HistoricalPriceIntervals,
} from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';
import { parseCaipAssetType } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { pick } from 'lodash';

import type { PriceApiClient } from '../../clients/price-api/PriceApiClient';
import type { SpotPrice } from '../../clients/price-api/types';
import {
  GET_HISTORICAL_PRICES_RESPONSE_NULL_OBJECT,
  VsCurrencyParamStruct,
  type FiatTicker,
} from '../../clients/price-api/types';
import { isFiat } from '../../utils/isFiat';
import { type ILogger } from '../../utils/logger';
import type { ConfigProvider } from '../config';
import type { HistoricalPrice } from './types';

export class TokenPricesService {
  readonly #priceApiClient: PriceApiClient;

  readonly #logger: ILogger;

  readonly cacheTtlsMilliseconds: {
    fiatExchangeRates: number;
    spotPrices: number;
    historicalPrices: number;
  };

  constructor({
    configProvider,
    priceApiClient,
    logger,
  }: {
    configProvider: ConfigProvider;
    priceApiClient: PriceApiClient;
    logger: ILogger;
  }) {
    this.#priceApiClient = priceApiClient;
    this.#logger = logger;

    const { cacheTtlsMilliseconds } = configProvider.get().priceApi;
    this.cacheTtlsMilliseconds = cacheTtlsMilliseconds;
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

  /**
   * Fetches fiat exchange rates and crypto prices for the given assets.
   * This is shared logic between getMultipleTokenConversions and getMultipleTokensMarketData.
   *
   * @param allAssets - Array of all CAIP asset types (both fiat and crypto).
   * @returns Promise resolving to fiat exchange rates and crypto prices.
   */
  async #fetchPriceData(allAssets: CaipAssetType[]): Promise<{
    fiatExchangeRates: Record<string, { value: number }>;
    cryptoPrices: Record<CaipAssetType, SpotPrice | null>;
  }> {
    const cryptoAssets = allAssets.filter((asset) => !isFiat(asset));

    const [fiatExchangeRates, cryptoPrices] = await Promise.all([
      this.#priceApiClient.getFiatExchangeRates(),
      this.#priceApiClient.getMultipleSpotPrices(cryptoAssets, 'usd'),
    ]);

    return { fiatExchangeRates, cryptoPrices };
  }

  /**
   * Get the token conversions for a list of asset pairs.
   * It caches the results for 1 hour.
   *
   * Beware: Inside we are using the Price API's `getFiatExchangeRates` method for fiat prices,
   * `getMultipleSpotPrices` for crypto prices and then using USD as an intermediate currency
   * to convert the prices to the correct currency. This is not entirely accurate but it's the
   * best we can do with the current API.
   *
   * @param conversions - The asset pairs to get the conversions for.
   * @returns The token conversions.
   */
  async getMultipleTokenConversions(
    conversions: { from: CaipAssetType; to: CaipAssetType }[],
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

    const { fiatExchangeRates, cryptoPrices } =
      await this.#fetchPriceData(allAssets);

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

      const now = Date.now();

      result[from][to] = {
        rate,
        conversionTime: now,
        expirationTime: now + this.cacheTtlsMilliseconds.historicalPrices,
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
  #computeMarketData(
    spotPrice: SpotPrice,
    rate: BigNumber,
  ): FungibleAssetMarketData {
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

    // Variations in percent don't need to be converted, they are independent of the currency
    const pricePercentChange = {
      ...includeIfDefined('PT1H', marketDataInUsd.pricePercentChange1h),
      ...includeIfDefined('P1D', marketDataInUsd.pricePercentChange1d),
      ...includeIfDefined('P7D', marketDataInUsd.pricePercentChange7d),
      ...includeIfDefined('P14D', marketDataInUsd.pricePercentChange14d),
      ...includeIfDefined('P30D', marketDataInUsd.pricePercentChange30d),
      ...includeIfDefined('P200D', marketDataInUsd.pricePercentChange200d),
      ...includeIfDefined('P1Y', marketDataInUsd.pricePercentChange1y),
    };

    const marketDataInToCurrency = {
      fungible: true,
      marketCap: toCurrency(marketDataInUsd.marketCap),
      totalVolume: toCurrency(marketDataInUsd.totalVolume),
      circulatingSupply: (marketDataInUsd.circulatingSupply ?? 0).toString(), // Circulating supply counts the number of tokens in circulation, so we don't convert
      allTimeHigh: toCurrency(marketDataInUsd.allTimeHigh),
      allTimeLow: toCurrency(marketDataInUsd.allTimeLow),
      //   Add pricePercentChange field only if it has values
      ...(Object.keys(pricePercentChange).length > 0
        ? { pricePercentChange }
        : {}),
    } as FungibleAssetMarketData;

    return marketDataInToCurrency;
  }

  async getMultipleTokensMarketData(
    assets: {
      asset: CaipAssetType;
      unit: CaipAssetType;
    }[],
  ): Promise<
    Record<CaipAssetType, Record<CaipAssetType, FungibleAssetMarketData>>
  > {
    if (assets.length === 0) {
      return {};
    }

    /**
     * `asset` and `unit` can represent both fiat and crypto assets. For us to get their values
     * the best approach is to use Price API's `getFiatExchangeRates` method for fiat prices,
     * `getMultipleSpotPrices` for crypto prices and then using USD as an intermediate currency
     * to convert the prices to the correct currency.
     */
    const allAssets = assets.flatMap((asset) => [asset.asset, asset.unit]);

    const { fiatExchangeRates, cryptoPrices } =
      await this.#fetchPriceData(allAssets);

    const result: Record<
      CaipAssetType,
      Record<CaipAssetType, FungibleAssetMarketData>
    > = {};

    assets.forEach((asset) => {
      const { asset: assetType, unit } = asset;

      // Skip if we don't have price data for the asset
      if (!cryptoPrices[assetType]) {
        return;
      }

      let unitUsdRate: BigNumber;

      if (isFiat(unit)) {
        /**
         * Beware:
         * We need to invert the fiat exchange rate because exchange rate != spot price
         */
        const fiatExchangeRate =
          fiatExchangeRates[this.#extractFiatTicker(unit)]?.value;

        if (!fiatExchangeRate) {
          return;
        }

        unitUsdRate = new BigNumber(1).dividedBy(fiatExchangeRate);
      } else {
        unitUsdRate = new BigNumber(cryptoPrices[unit]?.price ?? 0);
      }

      if (unitUsdRate.isZero()) {
        return;
      }

      // Initialize the nested structure for the asset if it doesn't exist
      if (!result[assetType]) {
        result[assetType] = {};
      }

      // Store the market data with the unit as the key
      result[assetType][unit] = this.#computeMarketData(
        cryptoPrices[assetType],
        unitUsdRate,
      );
    });

    return result;
  }

  async getHistoricalPrice(
    from: CaipAssetType,
    to: CaipAssetType,
  ): Promise<HistoricalPrice> {
    assert(from, CaipAssetTypeStruct);
    assert(to, CaipAssetTypeStruct);

    const toTicker = parseCaipAssetType(to).assetReference.toLowerCase();
    assert(toTicker, VsCurrencyParamStruct);

    const timePeriodsToFetch = ['1d', '7d', '1m', '3m', '1y', '1000y'];

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
      expirationTime: now + this.cacheTtlsMilliseconds.historicalPrices,
    };

    return result;
  }
}
