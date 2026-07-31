import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { DEFAULT_SEND_CONTEXT } from '../../../../features/send/render';
import { Send } from '../../../../features/send/Send';
import type { SendContext } from '../../../../features/send/types';
import { assetsService, configProvider, priceApiClient, state, accountsService } from '../../../../snapContext';
import type { UnencryptedStateValue } from '../../../services/state/State';
import {
  getInterfaceContext,
  getPreferences,
  SEND_FORM_INTERFACE_NAME,
  updateInterface,
} from '../../../utils/interface';
import baseLogger, { createPrefixedLogger } from '../../../utils/logger';

export const refreshSend: OnCronjobHandler = async () => {
  const logger = createPrefixedLogger(baseLogger, '[refreshSend]');

  logger.info(`Background event triggered`);

  const [accounts, activeNetworks, mapInterfaceNameToId, preferences] =
    await Promise.all([
      accountsService.getAll(),
      configProvider.getActiveNetworks(),
      state.getKey<UnencryptedStateValue['mapInterfaceNameToId']>(
        'mapInterfaceNameToId',
      ),
      getPreferences().catch(() => DEFAULT_SEND_CONTEXT.preferences),
    ]);

  const assets = (
    await Promise.all(
      accounts.flatMap((account) =>
        activeNetworks.map((network) =>
          assetsService.getAccountAssetsByScope(network, account.id),
        ),
      ),
    )
  ).flat();

  const assetTypes = assets.flatMap((asset) => asset.assetType);

  const sendFormInterfaceId = mapInterfaceNameToId?.[SEND_FORM_INTERFACE_NAME];

  // Don't do anything if the send form interface is not open
  if (!sendFormInterfaceId) {
    logger.info(`No send form interface found`);
    return;
  }

  // Check if context exists in case the UI was closed before the background event ran
  const interfaceContext =
    await getInterfaceContext<SendContext>(sendFormInterfaceId);

  if (!interfaceContext) {
    logger.info(`Interface context no longer exists, skipping refresh`);
    return;
  }

  try {
    // First, fetch the token prices
    const tokenPrices = await priceApiClient.getMultipleSpotPrices(
      assetTypes,
      preferences.currency,
    );

    // Save them in the state
    await state.setKey('tokenPrices', tokenPrices);

    // Check if context exists in case the UI was closed while fetching prices
    const latestInterfaceContext =
      await getInterfaceContext<SendContext>(sendFormInterfaceId);

    if (!latestInterfaceContext) {
      logger.info(
        `Interface context no longer exists after fetching prices, skipping update`,
      );
      return;
    }

    // Update the current context with the new rates
    const updatedInterfaceContext = {
      ...latestInterfaceContext,
      tokenPrices: {
        ...latestInterfaceContext.tokenPrices,
        ...tokenPrices,
      },
    };

    await updateInterface(
      sendFormInterfaceId,
      <Send context={updatedInterfaceContext} />,
      updatedInterfaceContext,
    );

    logger.info(`✅ Background event suceeded`);

    // Schedule the next run
    await snap.request({
      method: 'snap_scheduleBackgroundEvent',
      params: { duration: 'PT30S', request: { method: 'refreshSend' } },
    });
  } catch (error) {
    logger.warn({ error }, `Could not refresh send interface`);
  }
};
