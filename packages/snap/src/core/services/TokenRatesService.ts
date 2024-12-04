import type { Balance } from '@metamask/keyring-api';
import type { SnapsProvider } from '@metamask/snaps-sdk';

import type { SendContext } from '../../features/send/views/SendForm/types';
import type { PriceApiClient } from '../clients/price-api/price-api-client';
import type { SpotPrice } from '../clients/price-api/types';
import { Networks, SolanaTokens } from '../constants/solana';
import type { ILogger } from '../utils/logger';
import type { SolanaState } from './state';

export class TokenRatesService {
  readonly #priceApiClient: PriceApiClient;

  readonly #snap: SnapsProvider;

  readonly #state: SolanaState;

  readonly #logger: ILogger;

  constructor(
    priceApiClient: PriceApiClient,
    _snap: SnapsProvider,
    _state: SolanaState,
    _logger: ILogger,
  ) {
    this.#priceApiClient = priceApiClient;
    this.#snap = _snap;
    this.#state = _state;
    this.#logger = _logger;
  }

  async refreshTokenRates() {
    this.#logger.info('💹 Refreshing token rates');

    const stateValue = await this.#state.get();
    const { tokenRates } = stateValue;

    const tokenSymbolsFromRatesInState = Object.keys(tokenRates);

    const tokenSymbolsFromUiContext = [];

    const sendFormInterfaceId = stateValue?.mapInterfaceNameToId?.['send-form'];

    // If the send form interface exists, we will also refresh the rates from the balances listed in the ui context.
    try {
      if (!sendFormInterfaceId) {
        throw new Error(
          'Tried to refresh currency rates but could not find interface id of the send form.',
        );
      }

      const context = await this.#snap.request({
        method: 'snap_getInterfaceContext',
        params: {
          id: sendFormInterfaceId,
        },
      });

      const { balances } = context as SendContext;

      tokenSymbolsFromUiContext.push(
        ...Object.values(balances).map((balance: Balance) => balance.unit),
      );
    } catch (error) {
      this.#logger.info(
        { error },
        'Could not fetch token rates from the UI context',
      );
    }

    // All unique currencies for which we will fetch the spot prices.
    const allTokenSymbols = new Set([
      ...tokenSymbolsFromRatesInState,
      ...tokenSymbolsFromUiContext,
    ]);

    // Now we will fetch the spot prices for all the rates we have.
    const promises = Array.from(allTokenSymbols).map(async (tokenSymbol) => {
      // TODO: For now, we read token info from the constants. Later, we will need to read it from the token metadata.
      const tokenInfo = SolanaTokens[tokenSymbol as keyof typeof SolanaTokens];

      const spotPrice = await this.#priceApiClient
        .getSpotPrice(Networks.Mainnet.id, tokenInfo.address)
        // Catch errors on individual calls, so that one that fails does not break for others.
        .catch((error) => {
          this.#logger.info(
            { error },
            `Could not fetch spot price for token ${tokenSymbol}`,
          );
          return undefined;
        });
      return {
        tokenSymbol,
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
      .filter((item): item is { tokenSymbol: string; spotPrice: SpotPrice } =>
        Boolean(item.spotPrice),
      )
      .forEach(({ tokenSymbol, spotPrice }) => {
        tokenRates[tokenSymbol] = {
          // TODO: For now, we read token info from the constants. Later, we will need to read it from the token metadata.
          ...SolanaTokens[tokenSymbol as keyof typeof SolanaTokens],
          currency: tokenSymbol,
          conversionRate: spotPrice.price,
          conversionDate: Date.now(),
          usdConversionRate: 9999, // TODO: What to do here?
        };
      });

    await this.#state.set({
      ...stateValue,
      tokenRates,
    });
  }
}
