import type { PriceApiClient } from '../../clients/price-api/PriceApiClient';
import type { SpotPrice } from '../../clients/price-api/types';
import { Network, Networks, type Caip19Id } from '../../constants/solana';
import { getNetworkFromToken } from '../../utils/getNetworkFromToken';
import type { ILogger } from '../../utils/logger';
import type { TokenPrice } from '../state/State';

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
}
