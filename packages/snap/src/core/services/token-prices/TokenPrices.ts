/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CaipAssetTypeStruct, type CaipAssetType } from '@metamask/keyring-api';
import type { AssetConversion } from '@metamask/snaps-sdk';
import { assert, object } from '@metamask/superstruct';
import BigNumber from 'bignumber.js';
import { groupBy, map, mapValues, pick } from 'lodash';

import type { PriceApiClient } from '../../clients/price-api/PriceApiClient';
import type { FiatTicker } from '../../clients/price-api/types';
import { getCaip19Address } from '../../utils/getCaip19Address';
import { isFiat } from '../../utils/isFiat';
import logger, { type ILogger } from '../../utils/logger';

export class TokenPricesService {
  readonly #priceApiClient: PriceApiClient;

  readonly #logger: ILogger;

  constructor(priceApiClient: PriceApiClient, _logger: ILogger = logger) {
    this.#priceApiClient = priceApiClient;
    this.#logger = _logger;
  }

  #fiatCaipIdToSymbol(caip19Id: CaipAssetType) {
    const caip19Address = getCaip19Address(caip19Id);
    return caip19Address.toLowerCase() as FiatTicker;
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
          fiatExchangeRates[this.#fiatCaipIdToSymbol(from)]?.value;

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
          fiatExchangeRates[this.#fiatCaipIdToSymbol(to)]?.value;

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

      const shouldIncludeMarketData =
        includeMarketData && !isFiat(from) && !isFiat(to);

      const marketData = (() => {
        if (!shouldIncludeMarketData) {
          return undefined;
        }

        const marketDataInUsd = pick(cryptoPrices[from], [
          'marketCap',
          'totalVolume',
          'circulatingSupply',
          'allTimeHigh',
          'allTimeLow',
        ]) as Record<string, number | null>;

        const marketDataInToCurrency = mapValues(marketDataInUsd, (value) =>
          value === null
            ? null
            : new BigNumber(value).dividedBy(toUsdRate).toString(),
        );

        return marketDataInToCurrency;
      })();

      result[from][to] = {
        rate,
        conversionTime: Date.now(),
        marketData,
      } as unknown as AssetConversion; // TODO: Remove this type assertion when snaps SDK is updated
    });

    return result;
  }

  async getMultipleTokenConversions2(
    conversions: { from: CaipAssetType; to: CaipAssetType }[],
    includeMarketData = true,
  ) {
    if (conversions.length === 0) {
      return {};
    }

    // Group conversions by `to` asset
    const conversionsGroupsByTo = groupBy(conversions, 'to');

    // Fetch spot prices, triggering one request per group per `to` asset (= per vsCurrency)
    const spotPricePromises = Object.values(conversionsGroupsByTo).map(
      async (conversionsGroup) => {
        const firstConversion = conversionsGroup[0];
        assert(firstConversion, object()); // Equivalent to - but more compact than - an undefined check + throw error
        const { to } = firstConversion;

        const vsCurrency = this.#fiatCaipIdToSymbol(to);
        const tokenCaip19Ids = map(conversionsGroup, 'from');

        const spotPrices = await this.#priceApiClient.getMultipleSpotPrices(
          tokenCaip19Ids,
          vsCurrency,
        );

        /**
         * Build a list of {from, to, spotPrice} objects.
         * It will be convenient later on to keep of the `from` and `to` in the data structure.
         * We will remove them at the end.
         */
        return Object.entries(spotPrices).map(([tokenCaip19Id, spotPrice]) => ({
          from: tokenCaip19Id,
          to,
          spotPrice,
        }));
      },
    );

    // Resolve all requests and flatten the list of lists into a single list
    // Also filter out null spot prices
    const spotPrices = (await Promise.all(spotPricePromises))
      .flat()
      .filter(({ spotPrice }) => spotPrice !== null);

    // Build the asset conversions from the spot prices
    const assetConversions = spotPrices.map(({ from, to, spotPrice }) => ({
      from,
      to,
      rate: spotPrice!.price.toString(),
      conversionTime: Date.now(),
      expirationTime: undefined, // TODO: Add expiration time
      marketData: includeMarketData
        ? pick(spotPrice, [
            'marketCap',
            'totalVolume',
            'circulatingSupply',
            'allTimeHigh',
            'allTimeLow',
          ])
        : undefined,
    }));

    // From the array of {from, to, ...assetConversion}, build the doubly-indexed map from -> to -> assetConversion
    const indexedByFromAndTo = assetConversions.reduce<
      Record<CaipAssetType, Record<CaipAssetType, AssetConversion>>
    >((acc, { from, to, ...rest }) => {
      assert(from, CaipAssetTypeStruct);
      if (!acc[from]) {
        acc[from] = {};
      }
      acc[from][to] = rest; // Using the rest to finally get rid of the `from` and `to` in the data structure
      return acc;
    }, {});

    return indexedByFromAndTo;
  }
}
