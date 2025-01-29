import type { CaipAssetType } from '@metamask/keyring-api';
import type { AssetConversion } from '@metamask/snaps-sdk';

import type { PriceApiClient } from '../../clients/price-api/PriceApiClient';
import type { SpotPriceResponse } from '../../clients/price-api/types';
import { getCaip19Address } from '../../utils/getCaip19Address';
import logger, { type ILogger } from '../../utils/logger';

/**
 * Maps token addresses to their corresponding currency tickers.
 * Used for converting between token addresses and currency codes.
 */
export const TOKEN_ADDRESS_TO_CRYPTO_CURRENCY: Record<string, string> = {
  // Bitcoin
  bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh: 'btc',
  // Ethereum
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e': 'eth',
  // Litecoin
  ltc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh: 'ltc',
  // Bitcoin Cash
  'bitcoincash:qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh': 'bch',
  // Binance Coin
  bnb1jxfh2g85q3v0tdq56fnevx6xcxtcnhtsmcu64m: 'bnb',
  // EOS
  'eosio.token': 'eos',
  // XRP
  rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh: 'xrp',
  // Stellar Lumens
  GDZKRELJ4KHDF7BEDNEJC4NQRLRIPQB5FXPQK6BTCSERVEQC6NQPH3DZ: 'xlm',
  // Chainlink
  '0x514910771af9ca656af840dff83e8264ecf986ca': 'link',
  // Polkadot
  '1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg': 'dot',
  // Yearn.finance
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': 'yfi',
};

export class TokenPrices {
  readonly #priceApiClient: PriceApiClient;

  readonly #logger: ILogger;

  constructor(priceApiClient: PriceApiClient, _logger: ILogger = logger) {
    this.#priceApiClient = priceApiClient;
    this.#logger = _logger;
  }

  #caipToCurrency(caip19Id: CaipAssetType): string {
    const isCurrency = caip19Id.includes('/iso4217:');
    const currency = isCurrency
      ? caip19Id?.split('/iso4217:')[1]
      : TOKEN_ADDRESS_TO_CRYPTO_CURRENCY[getCaip19Address(caip19Id)];

    return currency ?? 'usd';
  }

  async getMultipleTokenPrices(
    caip19Ids: CaipAssetType[],
    currency?: string,
  ): Promise<SpotPriceResponse> {
    if (caip19Ids.length === 0) {
      return {};
    }

    try {
      const tokenPrices = await this.#priceApiClient.getMultipleSpotPrices(
        caip19Ids,
        currency,
      );

      return tokenPrices;
    } catch (error) {
      this.#logger.error(error, 'Error fetching token prices');
      return {};
    }
  }

  async getMultipleTokenConversions(
    conversions: { from: CaipAssetType; to: CaipAssetType }[],
  ): Promise<Record<CaipAssetType, Record<CaipAssetType, AssetConversion>>> {
    const result: Record<
      CaipAssetType,
      Record<CaipAssetType, AssetConversion>
    > = {};
    const to = conversions[0]?.to as CaipAssetType;

    const tokenPrices = await this.#priceApiClient.getMultipleSpotPrices(
      conversions.map((conversion) => conversion.from),
      this.#caipToCurrency(to),
    );

    conversions.forEach((conversion) => {
      const fromAssetId = conversion.from;
      const toAssetId = conversion.to;
      const assetPrice = tokenPrices[fromAssetId]?.price;

      if (!assetPrice) {
        return;
      }

      result[fromAssetId] = {
        [toAssetId]: {
          rate: assetPrice.toString(),
          conversionTime: Date.now(),
        },
      };
    });

    return result;
  }
}
