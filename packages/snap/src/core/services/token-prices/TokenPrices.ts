import { type CaipAssetType } from '@metamask/keyring-api';
import type { AssetConversion } from '@metamask/snaps-sdk';
import { parseCaipAssetType } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { pick } from 'lodash';

import type { PriceApiClient } from '../../clients/price-api/PriceApiClient';
import type { SpotPrice } from '../../clients/price-api/structs';
import type { FiatTicker } from '../../clients/price-api/types';
import { isFiat } from '../../utils/isFiat';
import logger, { type ILogger } from '../../utils/logger';

export class TokenPricesService {
  readonly #priceApiClient: PriceApiClient;

  readonly #logger: ILogger;

  constructor(priceApiClient: PriceApiClient, _logger: ILogger = logger) {
    this.#priceApiClient = priceApiClient;
    this.#logger = _logger;
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
        expirationTime: undefined,
        // marketData, // TODO: Enable this when snaps SDK is updated
      };
    });

    return result;
  }

  /**
   * Computes the market data object in the target currency.
   *
   * TODO: Type the return with `AssetConversion['marketData']` when snap SDK is updated.
   *
   * @param spotPrice - The spot price of the asset in source currency.
   * @param rate - The rate to convert the market data to from source currency to target currency.
   * @returns The market data in the target currency.
   */
  #computeMarketData(spotPrice: SpotPrice, rate: BigNumber) {
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

    const toCurrency = (value: number | null | undefined) =>
      value === null || value === undefined
        ? null
        : new BigNumber(value).dividedBy(rate).toString();

    const marketDataInToCurrency = {
      marketCap: toCurrency(marketDataInUsd.marketCap),
      totalVolume: toCurrency(marketDataInUsd.totalVolume),
      circulatingSupply: marketDataInUsd.circulatingSupply, // Circulating supply counts the number of tokens in circulation, so we don't convert
      allTimeHigh: toCurrency(marketDataInUsd.allTimeHigh),
      allTimeLow: toCurrency(marketDataInUsd.allTimeLow),
      // Variations in percent don't need to be converted, they are independent of the currency
      pricePercentChange: {
        PT1H: marketDataInUsd.pricePercentChange1h,
        P1D: marketDataInUsd.pricePercentChange1d,
        P7D: marketDataInUsd.pricePercentChange7d,
        P14D: marketDataInUsd.pricePercentChange14d,
        P30D: marketDataInUsd.pricePercentChange30d,
        P200D: marketDataInUsd.pricePercentChange200d,
        P1Y: marketDataInUsd.pricePercentChange1y,
      },
    };

    return marketDataInToCurrency;
  }
}
