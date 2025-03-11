import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { Confirmation } from '../../../../features/confirmation/Confirmation';
import type { ConfirmationContext } from '../../../../features/confirmation/types';
import { state, transactionScanService } from '../../../../snapContext';
import {
  CONFIRMATION_INTERFACE_NAME,
  getInterfaceContext,
  updateInterface,
} from '../../../utils/interface';
import logger from '../../../utils/logger';
import { CronjobMethod } from './CronjobMethod';

export const refreshConfirmationEstimation: OnCronjobHandler = async () => {
  try {
    logger.info(
      `[${CronjobMethod.RefreshConfirmationEstimation}] Cronjob triggered`,
    );

    const stateValue = await state.get();
    const confirmationInterfaceId =
      stateValue?.mapInterfaceNameToId?.[CONFIRMATION_INTERFACE_NAME];

    // Update the interface context with the new rates.
    try {
      if (confirmationInterfaceId) {
        // Get the current context
        const interfaceContext = (await getInterfaceContext(
          confirmationInterfaceId,
        )) as ConfirmationContext;

        if (!interfaceContext) {
          logger.info(
            `[${CronjobMethod.RefreshConfirmationEstimation}] No interface context found`,
          );
          return;
        }

        if (
          !interfaceContext.account?.address ||
          !interfaceContext.transaction ||
          !interfaceContext.scope ||
          !interfaceContext.method
        ) {
          logger.info(
            `[${CronjobMethod.RefreshConfirmationEstimation}] Context is missing required fields`,
          );
          return;
        }

        const fetchingConfirmationContext = {
          ...interfaceContext,
          scanFetchStatus: 'fetching',
        } as ConfirmationContext;

        await updateInterface(
          confirmationInterfaceId,
          <Confirmation context={fetchingConfirmationContext} />,
          fetchingConfirmationContext,
        );

        const scan = await transactionScanService.scanTransaction({
          method: interfaceContext.method,
          accountAddress: interfaceContext.account.address,
          transaction: interfaceContext.transaction,
          scope: interfaceContext.scope,
        });

        const updatedInterfaceContextFinal = (await getInterfaceContext(
          confirmationInterfaceId,
        )) as ConfirmationContext;

        // Update the current context with the new rates
        const updatedInterfaceContext = {
          ...updatedInterfaceContextFinal,
          scanFetchStatus: 'fetched' as const,
          scan,
        };

        logger.info(
          `[${CronjobMethod.RefreshConfirmationEstimation}] New scan fetched`,
        );

        await updateInterface(
          confirmationInterfaceId,
          <Confirmation context={updatedInterfaceContext} />,
          updatedInterfaceContext,
        );
      }

      logger.info(
        `[${CronjobMethod.RefreshConfirmationEstimation}] Cronjob suceeded`,
      );
    } catch (error) {
      if (!confirmationInterfaceId) {
        logger.info(
          `[${CronjobMethod.RefreshConfirmationEstimation}] No interface context found`,
        );
        return;
      }

      const fetchedInterfaceContext = (await getInterfaceContext(
        confirmationInterfaceId,
      )) as ConfirmationContext;
      const fetchingConfirmationContext = {
        ...fetchedInterfaceContext,
        scanFetchStatus: 'fetched',
      } as ConfirmationContext;

      await updateInterface(
        confirmationInterfaceId,
        <Confirmation context={fetchingConfirmationContext} />,
        fetchingConfirmationContext,
      );

      logger.info(
        { error },
        `[${CronjobMethod.RefreshConfirmationEstimation}] Could not update the interface. But rolled back status to fetched.`,
      );
    }
  } catch (error) {
    logger.info(
      { error },
      `[${CronjobMethod.RefreshConfirmationEstimation}] Cronjob failed`,
    );
  }
};
