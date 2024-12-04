import type { Balance } from '@metamask/keyring-api';
import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { SendForm } from '../../../features/send/views/SendForm/SendForm';
import type { SendContext } from '../../../features/send/views/SendForm/types';
import { priceApiClient, state } from '../../../snap-context';
import type { SpotPrice } from '../../clients/price-api/types';
import { Networks, SolanaTokens } from '../../constants/solana';
import type { TokenRate } from '../../services/state';
import logger from '../../utils/logger';

export const refreshTokenRates: OnCronjobHandler = async () => {
  try {
    logger.info('[refreshTokenRates] Cronjob triggered');

    const tokenRates: Record<string, TokenRate> = {};

    const stateValue = await state.get();

    const tokenSymbolsFromRatesInState = Object.keys(
      stateValue?.tokenRates ?? {},
    );

    const tokenSymbolsFromUiContext = [];

    const sendFormInterfaceId =
      stateValue?.mapInterfaceNameToId?.[SendForm.name];

    // If the send form interface exists, we will also refresh the rates from the balances listed in the ui context.
    try {
      if (!sendFormInterfaceId) {
        throw new Error(
          'Tried to refresh currency rates but could not find interface id of the send form.',
        );
      }

      const context = await snap.request({
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
      logger.info({ error }, '[refreshTokenRates] Cronjob failed');
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

      const spotPrice = await priceApiClient
        .getSpotPrice(Networks.Mainnet.id, tokenInfo.address)
        // Catch errors on individual calls, so that one that fails does not break for others.
        .catch((error) => {
          logger.info(
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
          usdConversionRate: 9999, // TODO: Implement this
        };
      });

    await state.set({
      ...stateValue,
      tokenRates,
    });
  } catch (error) {
    logger.info({ error }, '[refreshTokenRates] Cronjob failed');
  }
};
