import type { CaipAssetType } from '@metamask/keyring-api';
import type { AssetConversion } from '@metamask/snaps-sdk';
import BigNumber from 'bignumber.js';

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

      result[from][to] = {
        rate,
        conversionTime: Date.now(),
      };
    });

    return result;
  }
}
