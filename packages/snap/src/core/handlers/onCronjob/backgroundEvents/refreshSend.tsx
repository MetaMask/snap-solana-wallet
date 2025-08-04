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
import logger from '../../../utils/logger';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

export const refreshSend: OnCronjobHandler = async () => {
  try {
    logger.info(
      `[${ScheduleBackgroundEventMethod.RefreshSend}] Background event triggered`,
    );

    const [assets, mapInterfaceNameToId, preferences] = await Promise.all([
      assetsService.getAll(),
      state.getKey<UnencryptedStateValue['mapInterfaceNameToId']>(
        'mapInterfaceNameToId',
      ),
      getPreferences().catch(() => DEFAULT_SEND_CONTEXT.preferences),
    ]);

    const assetTypes = assets.flatMap((asset) => asset.assetType);

    // let tokenPrices: SpotPrices = {};

    // try {
    //   // First, fetch the token prices
    //   tokenPrices = await priceApiClient.getMultipleSpotPrices(
    //     assetTypes,
    //     preferences.currency,
    //   );

    //   // Then, update the state
    //   await state.setKey('tokenPrices', tokenPrices);

    //   logger.info(
    //     `[${CronjobMethod.RefreshSend}] ✅ Token prices were properly refreshed and saved in the state.`,
    //   );
    // } catch (error) {
    //   logger.info(
    //     { error },
    //     `[${CronjobMethod.RefreshSend}] ❌ Could not update the token prices in the state.`,
    //   );
    // }

    // try {
    const sendFormInterfaceId =
      mapInterfaceNameToId?.[SEND_FORM_INTERFACE_NAME];

    // If the send form interface is not open, we don't need to refresh the token prices
    if (!sendFormInterfaceId) {
      logger.info(
        `[${ScheduleBackgroundEventMethod.RefreshSend}] ❌ No send form interface found`,
      );
      return;
    }

    // If the interface is open, update the context
    // if (sendFormInterfaceId) {
    // First, fetch the token prices
    const tokenPrices = await priceApiClient.getMultipleSpotPrices(
      assetTypes,
      preferences.currency,
    );

    // Get the current context
    const interfaceContext =
      await getInterfaceContextOrThrow<SendContext>(sendFormInterfaceId);

    // We only want to refresh the token prices when the user is in the transaction confirmation stage
    if (interfaceContext.stage !== 'transaction-confirmation') {
      logger.info(
        `[${ScheduleBackgroundEventMethod.RefreshSend}] ❌ Not in transaction confirmation stage`,
      );
      return;
    }

    if (!interfaceContext.assets) {
      logger.info(
        `[${ScheduleBackgroundEventMethod.RefreshSend}] ❌ No assets found`,
      );
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
    // }
    // } catch (error) {
    //   logger.info(
    //     { error },
    //     `[${CronjobMethod.RefreshSend}] ❌ Could not update the interface`,
    //   );
    // }
    logger.info(
      `[${ScheduleBackgroundEventMethod.RefreshSend}] ✅ Background event suceeded`,
    );

    // Schedule the next run (only if the send form interface is open)
    if (sendFormInterfaceId) {
      await snap.request({
        method: 'snap_scheduleBackgroundEvent',
        params: { duration: 'PT30S', request: { method: 'refreshSend' } },
      });
    }
  } catch (error) {
    logger.warn(
      { error },
      `[${ScheduleBackgroundEventMethod.RefreshSend}] ❌ Background event failed`,
    );
  }
};
