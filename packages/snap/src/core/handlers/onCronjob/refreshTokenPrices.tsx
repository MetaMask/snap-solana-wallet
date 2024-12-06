import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { Send } from '../../../features/send/Send';
import type { SendContext } from '../../../features/send/types';
import { state, tokenPricesService } from '../../../snap-context';
import {
  getInterfaceContext,
  SEND_FORM_INTERFACE_NAME,
  updateInterface,
} from '../../utils/interface';
import logger from '../../utils/logger';

export const refreshTokenPrices: OnCronjobHandler = async () => {
  try {
    logger.info('[refreshTokenPrices] Cronjob triggered');

    const stateValue = await state.get();
    const sendFormInterfaceId =
      stateValue?.mapInterfaceNameToId?.[SEND_FORM_INTERFACE_NAME];

    const tokenPrices = await tokenPricesService.refreshPrices(
      sendFormInterfaceId,
    );

    // Update the interface context with the new rates.
    try {
      if (sendFormInterfaceId) {
        // Get the current context
        const interfaceContext = await getInterfaceContext(sendFormInterfaceId);

        // Update the current context with the new rates
        const updatedInterfaceContext = {
          ...(interfaceContext as SendContext),
          tokenPrices,
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
