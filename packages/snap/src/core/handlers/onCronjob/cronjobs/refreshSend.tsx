import type { CaipAssetType, OnCronjobHandler } from '@metamask/snaps-sdk';
import { type SpotPrices } from 'src/core/clients/price-api/types';

import { DEFAULT_SEND_CONTEXT } from '../../../../features/send/render';
import { Send } from '../../../../features/send/Send';
import type { SendContext } from '../../../../features/send/types';
import { priceApiClient, state } from '../../../../snapContext';
import type { UnencryptedStateValue } from '../../../services/state/State';
import {
  getInterfaceContextOrThrow,
  getPreferences,
  SEND_FORM_INTERFACE_NAME,
  updateInterface,
} from '../../../utils/interface';
import logger from '../../../utils/logger';
import { CronjobMethod } from './CronjobMethod';

export const refreshSend: OnCronjobHandler = async () => {
  const [assets, mapInterfaceNameToId, preferences] = await Promise.all([
    state.getKey<UnencryptedStateValue['assets']>('assets'),
    state.getKey<UnencryptedStateValue['mapInterfaceNameToId']>(
      'mapInterfaceNameToId',
    ),
    getPreferences().catch(() => DEFAULT_SEND_CONTEXT.preferences),
  ]);

  try {
    logger.info(`[${CronjobMethod.RefreshSend}] Cronjob triggered`);

    const assetsFromAllAccounts = Object.values(assets ?? {}).flatMap(
      (accountAssets) => Object.keys(accountAssets),
    ) as CaipAssetType[];

    let tokenPrices: SpotPrices = {};

    try {
      // First, fetch the token prices
      tokenPrices = await priceApiClient.getMultipleSpotPrices(
        assetsFromAllAccounts,
        preferences.currency,
      );

      // Then, update the state
      await state.setKey('tokenPrices', tokenPrices);

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
        mapInterfaceNameToId?.[SEND_FORM_INTERFACE_NAME];

      // If the interface is open, update the context
      if (sendFormInterfaceId) {
        // Get the current context
        const interfaceContext = await getInterfaceContextOrThrow<SendContext>(
          sendFormInterfaceId,
        );

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

        // Update the current context with the new rates
        const updatedInterfaceContext = {
          ...interfaceContext,
          tokenPrices: {
            ...interfaceContext.tokenPrices,
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
