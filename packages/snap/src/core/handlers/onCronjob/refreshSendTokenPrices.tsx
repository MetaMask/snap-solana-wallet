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

export const refreshSendTokenPrices: OnCronjobHandler = async () => {
  try {
    logger.info('[refreshSendTokenPrices] Cronjob triggered');

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

        // we only want to refresh the token prices when the user is in the transaction confirmation stage
        if (interfaceContext.stage !== 'transaction-confirmation') {
          logger.info(
            '[refreshUiTokenPrices] Not in transaction confirmation stage',
          );
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
        '[refreshSendTokenPrices] Could not update the interface, but token prices were properly refreshed and saved in the state.',
      );
    }
    logger.info('[refreshSendTokenPrices] Cronjob suceeded');
  } catch (error) {
    logger.info({ error }, '[refreshSendTokenPrices] Cronjob failed');
  }
};
