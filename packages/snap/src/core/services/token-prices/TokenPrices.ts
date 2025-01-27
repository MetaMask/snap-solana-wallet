import type { CaipAssetType } from '@metamask/keyring-api';

import type { PriceApiClient } from '../../clients/price-api/PriceApiClient';
import type { SpotPrice } from '../../clients/price-api/types';
import { Network, Networks, type Caip19Id } from '../../constants/solana';
import { getCaip19Address } from '../../utils/getCaip19Address';
import { getNetworkFromToken } from '../../utils/getNetworkFromToken';
import type { ILogger } from '../../utils/logger';
import type { TokenPrice } from '../state/State';

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

  constructor(priceApiClient: PriceApiClient, _logger: ILogger) {
    this.#priceApiClient = priceApiClient;
    this.#logger = _logger;
  }

  async getMultipleTokenPrices(
    caip19Ids: string[],
    currency?: string,
  ): Promise<Record<Caip19Id, TokenPrice>> {
    const tokenPrices: Record<string, TokenPrice> = {};

    const promises = caip19Ids.map(async (caip19Id) => {
      // FIXME: This is a hack to get the token address from the caip19Id.
      const address = caip19Id.split('/token:')[1] as string;
      const tokenAddress =
        address ?? Networks[Network.Mainnet].nativeToken.address;

      const spotPrice = await this.#priceApiClient
        .getSpotPrice(
          getNetworkFromToken(caip19Id),
          tokenAddress,
          currency ?? 'usd',
        )
        // Catch errors on individual calls, so that one that fails does not break for others.
        .catch((error) => {
          this.#logger.info(
            { error },
            `Could not fetch spot price for token ${caip19Id}`,
          );
          return undefined;
        });

      return {
        caip19Id,
        spotPrice,
      };
    });

    const tokenSymbolsWithSpotPrices = await Promise.all(promises);

    // Update the rates with the spot prices.
    tokenSymbolsWithSpotPrices
      /**
       * We filter out currencies for which we could not fetch the spot price.
       * This is to ensure that we do not mess up the state for currencies that possibly had a correct spot price before.
       */
      .filter((item): item is { caip19Id: Caip19Id; spotPrice: SpotPrice } =>
        Boolean(item.spotPrice),
      )
      .forEach(({ caip19Id, spotPrice }) => {
        tokenPrices[caip19Id] = {
          price: spotPrice.price,
        };
      });

    return tokenPrices;
  }

  async getMultipleTokenConversions(
    conversions: { from: CaipAssetType; to: CaipAssetType }[],
  ): Promise<
    Record<
      CaipAssetType,
      Record<CaipAssetType, { rate: string | null; conversionTime: number }>
    >
  > {
    return Promise.all(
      conversions.map(async (conversion) =>
        this.getTokenConversion(conversion.from, conversion.to).catch(() => ({
          price: null,
          conversionTime: Date.now(),
        })),
      ),
    ).then((prices) =>
      prices.reduce<
        Record<
          string,
          Record<string, { rate: string | null; conversionTime: number }>
        >
      >((acc, price, index) => {
        const from = conversions[index]?.from;
        const to = conversions[index]?.to;

        if (from && to) {
          if (!acc[from]) {
            acc[from] = {};
          }
          acc[from][to] = {
            rate: price.price?.toString() ?? null,
            conversionTime: Date.now(),
          };
        }
        return acc;
      }, {}),
    );
  }

  async getTokenConversion(
    from: CaipAssetType,
    to: CaipAssetType,
  ): Promise<TokenPrice> {
    const toIsCurrency = to.includes('/iso4217:');

    const fromNetwork = getNetworkFromToken(from);
    const fromToken = getCaip19Address(from);
    const currency = toIsCurrency
      ? getCaip19Address(to)?.toLowerCase()
      : TOKEN_ADDRESS_TO_CRYPTO_CURRENCY[getCaip19Address(to)];

    return this.#priceApiClient.getSpotPrice(fromNetwork, fromToken, currency);
  }
}
