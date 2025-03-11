import type { CaipAssetType, OnCronjobHandler } from '@metamask/snaps-sdk';

import { DEFAULT_SEND_CONTEXT } from '../../../../features/send/render';
import { Send } from '../../../../features/send/Send';
import type { SendContext } from '../../../../features/send/types';
import { state, tokenPricesService } from '../../../../snapContext';
import type { SpotPrices } from '../../../clients/price-api/types';
import {
  getInterfaceContext,
  getPreferences,
  SEND_FORM_INTERFACE_NAME,
  updateInterface,
} from '../../../utils/interface';
import logger from '../../../utils/logger';
import { CronjobMethod } from './CronjobMethod';

export const refreshSend: OnCronjobHandler = async () => {
  const [stateValue, preferences] = await Promise.all([
    state.get(),
    getPreferences().catch(() => DEFAULT_SEND_CONTEXT.preferences),
  ]);

  try {
    logger.info(`[${CronjobMethod.RefreshSend}] Cronjob triggered`);

    const assetsFromAllAccounts = Object.values(stateValue.assets).flatMap(
      (accountAssets) => Object.keys(accountAssets),
    ) as CaipAssetType[];

    let tokenPrices: SpotPrices = {};

    try {
      // First, fetch the token prices
      tokenPrices = await tokenPricesService.getMultipleTokenPrices(
        assetsFromAllAccounts,
        preferences.currency,
      );

      // then, update the state
      await state.update((currentState) => {
        return {
          ...currentState,
          tokenPrices: {
            ...currentState.tokenPrices,
            ...tokenPrices,
          },
        };
      });

      logger.info(
        `[${CronjobMethod.RefreshSend}] ✅ Token prices were properly refreshed and saved in the state.`,
      );
    } catch (error) {
      logger.info(
        { error },
        `[${CronjobMethod.RefreshSend}] ❌ Could not update the token prices in the state.`,
      );
    }

    try {
      const sendFormInterfaceId =
        stateValue?.mapInterfaceNameToId?.[SEND_FORM_INTERFACE_NAME];

      // If the interface is open, update the context
      if (sendFormInterfaceId) {
        // Get the current context
        const interfaceContext = (await getInterfaceContext(
          sendFormInterfaceId,
        )) as SendContext;

        if (!interfaceContext) {
          logger.info(
            `[${CronjobMethod.RefreshSend}] No interface context found`,
          );
          return;
        }

        // we only want to refresh the token prices when the user is in the transaction confirmation stage
        if (interfaceContext.stage !== 'transaction-confirmation') {
          logger.info(
            `[${CronjobMethod.RefreshSend}] ❌ Not in transaction confirmation stage`,
          );
          return;
        }

        if (!interfaceContext.assets) {
          logger.info(`[${CronjobMethod.RefreshSend}] ❌ No assets found`);
          return;
        }

        const updatedInterfaceContextFinal = (await getInterfaceContext(
          sendFormInterfaceId,
        )) as SendContext;

        // Update the current context with the new rates
        const updatedInterfaceContext = {
          ...updatedInterfaceContextFinal,
          tokenPrices: {
            ...updatedInterfaceContextFinal.tokenPrices,
            ...tokenPrices,
          },
        };

        await updateInterface(
          sendFormInterfaceId,
          <Send context={updatedInterfaceContext} />,
          updatedInterfaceContext,
        );
      }
    } catch (error) {
      logger.info(
        { error },
        `[${CronjobMethod.RefreshSend}] ❌ Could not update the interface`,
      );
    }
    logger.info(`[${CronjobMethod.RefreshSend}] ✅ Cronjob suceeded`);
  } catch (error) {
    logger.info({ error }, `[${CronjobMethod.RefreshSend}] ❌ Cronjob failed`);
  }
};
