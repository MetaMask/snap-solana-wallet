import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { Send } from '../../../features/send/Send';
import type { SendContext } from '../../../features/send/types';
import { state, tokenPricesService } from '../../../snapContext';
import {
  getInterfaceContext,
  SEND_FORM_INTERFACE_NAME,
  updateInterface,
} from '../../utils/interface';
import logger from '../../utils/logger';

export const refreshUiTokenPrices: OnCronjobHandler = async () => {
  try {
    logger.info('[refreshUiTokenPrices] Cronjob triggered');

    const stateValue = await state.get();
    const sendFormInterfaceId =
      stateValue?.mapInterfaceNameToId?.[SEND_FORM_INTERFACE_NAME];

    // Update the interface context with the new rates.
    try {
      if (sendFormInterfaceId) {
        // Get the current context
        const interfaceContext = (await getInterfaceContext(
          sendFormInterfaceId,
        )) as SendContext;

        if (!interfaceContext) {
          logger.info('[refreshUiTokenPrices] No interface context found');
          return;
        }

        if (!interfaceContext.assets) {
          logger.info('[refreshUiTokenPrices] No assets found');
          return;
        }

        const tokenPrices = await tokenPricesService.getMultipleTokenPrices(
          interfaceContext.assets,
          interfaceContext.preferences.currency,
        );

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
        '[refreshTokenPrices] Could not update the interface, but token prices were properly refreshed and saved in the state.',
      );
    }
    logger.info('[refreshTokenPrices] Cronjob suceeded');
  } catch (error) {
    logger.info({ error }, '[refreshTokenPrices] Cronjob failed');
  }
};
