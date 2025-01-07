import type { SendContext } from '../../features/send/types';
import type { PriceApiClient } from '../clients/price-api/price-api-client';
import type { SpotPrice } from '../clients/price-api/types';
import type { Caip19Id } from '../constants/solana';
import { Network, TokenMetadata } from '../constants/solana';
import type { ILogger } from '../utils/logger';
import type { SolanaState, TokenPrice } from './state';

export class TokenPricesService {
  readonly #priceApiClient: PriceApiClient;

  readonly #state: SolanaState;

  readonly #logger: ILogger;

  constructor(
    priceApiClient: PriceApiClient,
    _state: SolanaState,
    _logger: ILogger,
  ) {
    this.#priceApiClient = priceApiClient;
    this.#state = _state;
    this.#logger = _logger;
  }

  /**
   * Refreshes the prices of the tokens present in the state and the UI context,
   * then stores them in the state.
   *
   * @param sendFormInterfaceId - The interface id of the send form, if it exists.
   * @returns The updated token prices.
   */
  async refreshPrices(
    sendFormInterfaceId?: string,
  ): Promise<Record<Caip19Id, TokenPrice>> {
    this.#logger.info('💹 Refreshing token prices');

    const stateValue = await this.#state.get();
    const { tokenPrices } = stateValue;

    const caip19IdsFromPricesInState = Object.keys(tokenPrices);
    const caip19IdsFromUiContext = [];
    let currency = 'usd';

    // If the send form interface exists, we will also refresh the rates from the balances listed in the ui context.
    // We gracefully handle the case where the send form interface does not exist because it's a normal scenario.
    try {
      if (!sendFormInterfaceId) {
        throw new Error(
          'Could not find an interface id for the send form in the state. It usually means that the send form was not opened. Otherwise, it might be that the snap state was overwritten.',
        );
      }

      const context = await snap.request({
        method: 'snap_getInterfaceContext',
        params: {
          id: sendFormInterfaceId,
        },
      });

      const { balances, preferences } = context as SendContext;

      currency = preferences.currency;

      caip19IdsFromUiContext.push(...Object.keys(balances));
    } catch (error) {
      this.#logger.info(
        { error },
        'Could not build a list of token symbols present in the UI context',
      );
    }

    // All unique token symbols for which we will fetch the spot prices.
    const allUniqueCaip19Ids = new Set([
      ...caip19IdsFromPricesInState,
      ...caip19IdsFromUiContext,
    ]);

    // Now we will fetch the spot prices for all the rates we have.
    const promises = Array.from(allUniqueCaip19Ids).map(async (caip19Id) => {
      // TODO: For now, we read token info from the constants. Later, we will need to read it from the token metadata.
      const tokenInfo = TokenMetadata[caip19Id as keyof typeof TokenMetadata];

      if (!tokenInfo) {
        return {
          caip19Id,
          spotPrice: undefined,
        };
      }

      const spotPrice = await this.#priceApiClient
        .getSpotPrice(Network.Mainnet, tokenInfo.address, currency)
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
          // TODO: For now, we read token info from the constants. Later, we will need to read it from the token metadata.
          ...TokenMetadata[caip19Id],
          price: spotPrice.price,
        };
      });

    await this.#state.set({
      ...stateValue,
      tokenPrices,
    });

    return tokenPrices;
  }
}
