import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { DEFAULT_SEND_CONTEXT } from '../../../../features/send/render';
import { Send } from '../../../../features/send/Send';
import type { SendContext } from '../../../../features/send/types';
import { assetsService, priceApiClient, state } from '../../../../snapContext';
import type { UnencryptedStateValue } from '../../../services/state/State';
import {
  getInterfaceContextOrThrow,
  getPreferences,
  SEND_FORM_INTERFACE_NAME,
  updateInterface,
} from '../../../utils/interface';
import baseLogger, { createPrefixedLogger } from '../../../utils/logger';

export const refreshSend: OnCronjobHandler = async () => {
  const logger = createPrefixedLogger(baseLogger, '[refreshSend]');

  logger.info(`Background event triggered`);

  const [assets, mapInterfaceNameToId, preferences] = await Promise.all([
    assetsService.getAll(),
    state.getKey<UnencryptedStateValue['mapInterfaceNameToId']>(
      'mapInterfaceNameToId',
    ),
    getPreferences().catch(() => DEFAULT_SEND_CONTEXT.preferences),
  ]);

  const assetTypes = assets.flatMap((asset) => asset.assetType);

  const sendFormInterfaceId = mapInterfaceNameToId?.[SEND_FORM_INTERFACE_NAME];

  // Don't do anything if the send form interface is not open
  if (!sendFormInterfaceId) {
    logger.info(`No send form interface found`);
    return;
  }

  // Schedule the next run
  await snap.request({
    method: 'snap_scheduleBackgroundEvent',
    params: { duration: 'PT30S', request: { method: 'refreshSend' } },
  });

  // First, fetch the token prices
  const tokenPrices = await priceApiClient.getMultipleSpotPrices(
    assetTypes,
    preferences.currency,
  );

  // Save them in the state
  await state.setKey('tokenPrices', tokenPrices);

  // Get the current context
  const interfaceContext =
    await getInterfaceContextOrThrow<SendContext>(sendFormInterfaceId);

  // We only want to refresh the token prices when the user is in the transaction confirmation stage
  if (interfaceContext.stage !== 'transaction-confirmation') {
    logger.info(`❌ Not in transaction confirmation stage`);
    return;
  }

  if (!interfaceContext.assets) {
    logger.info(`❌ No assets found`);
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

  logger.info(`✅ Background event suceeded`);
};
