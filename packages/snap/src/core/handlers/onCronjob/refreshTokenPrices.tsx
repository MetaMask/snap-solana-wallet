import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { SendForm } from '../../../features/send/views/SendForm/SendForm';
import type { SendContext } from '../../../features/send/views/SendForm/types';
import { state, tokenPricesService } from '../../../snap-context';
import {
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
        const interfaceContext = await snap.request({
          method: 'snap_getInterfaceContext',
          params: {
            id: sendFormInterfaceId,
          },
        });

        // Update the current context with the new rates
        const updatedInterfaceContext = {
          ...(interfaceContext as SendContext),
          tokenPrices,
        };

        await updateInterface(
          sendFormInterfaceId,
          <SendForm context={updatedInterfaceContext} />,
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
