import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { ConfirmTransactionRequest } from '../../../../features/confirmation/views/ConfirmTransactionRequest/ConfirmTransactionRequest';
import type { ConfirmTransactionRequestContext } from '../../../../features/confirmation/views/ConfirmTransactionRequest/types';
import { state, transactionScanService } from '../../../../snapContext';
import type { UnencryptedStateValue } from '../../../services/state/State';
import {
  CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME,
  getInterfaceContextOrThrow,
  updateInterface,
} from '../../../utils/interface';
import logger from '../../../utils/logger';
import { CronjobMethod } from './CronjobMethod';

export const refreshConfirmationEstimation: OnCronjobHandler = async () => {
  try {
    logger.info(
      `[${CronjobMethod.RefreshConfirmationEstimation}] Cronjob triggered`,
    );

    const mapInterfaceNameToId =
      (await state.getKey<UnencryptedStateValue['mapInterfaceNameToId']>(
        'mapInterfaceNameToId',
      )) ?? {};

    const confirmationInterfaceId =
      mapInterfaceNameToId[CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME];

    // Update the interface context with the new rates.
    try {
      if (confirmationInterfaceId) {
        // Get the current context
        const interfaceContext =
          await getInterfaceContextOrThrow<ConfirmTransactionRequestContext>(
            confirmationInterfaceId,
          );

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

        // Skip transaction simulation if the preference is disabled
        if (!interfaceContext.preferences?.simulateOnChainActions) {
          logger.info(
            `[${CronjobMethod.RefreshConfirmationEstimation}] Transaction simulation is disabled in preferences`,
          );
          return;
        }

        const fetchingConfirmationContext = {
          ...interfaceContext,
          scanFetchStatus: 'fetching',
        } as ConfirmTransactionRequestContext;

        await updateInterface(
          confirmationInterfaceId,
          <ConfirmTransactionRequest context={fetchingConfirmationContext} />,
          fetchingConfirmationContext,
        );

        const scan = await transactionScanService.scanTransaction({
          method: interfaceContext.method,
          accountAddress: interfaceContext.account.address,
          transaction: interfaceContext.transaction,
          scope: interfaceContext.scope,
          origin: interfaceContext.origin,
          account: interfaceContext.account,
        });

        const updatedInterfaceContextFinal =
          await getInterfaceContextOrThrow<ConfirmTransactionRequestContext>(
            confirmationInterfaceId,
          );

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
          <ConfirmTransactionRequest context={updatedInterfaceContext} />,
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

      const fetchedInterfaceContext =
        await getInterfaceContextOrThrow<ConfirmTransactionRequestContext>(
          confirmationInterfaceId,
        );

      const fetchingConfirmationContext = {
        ...fetchedInterfaceContext,
        scanFetchStatus: 'fetched',
      } as ConfirmTransactionRequestContext;

      await updateInterface(
        confirmationInterfaceId,
        <ConfirmTransactionRequest context={fetchingConfirmationContext} />,
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
