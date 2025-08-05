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
import baseLogger, { createPrefixedLogger } from '../../../utils/logger';

export const refreshConfirmationEstimation: OnCronjobHandler = async () => {
  const logger = createPrefixedLogger(
    baseLogger,
    '[refreshConfirmationEstimation]',
  );

  logger.info(`Background event triggered`);

  const mapInterfaceNameToId =
    (await state.getKey<UnencryptedStateValue['mapInterfaceNameToId']>(
      'mapInterfaceNameToId',
    )) ?? {};

  const confirmationInterfaceId =
    mapInterfaceNameToId[CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME];

  // Don't do anything if the confirmation interface is not open
  if (!confirmationInterfaceId) {
    logger.info(`No interface context found`);
    return;
  }

  // Get the current context
  const interfaceContext =
    await getInterfaceContextOrThrow<ConfirmTransactionRequestContext>(
      confirmationInterfaceId,
    );

  // Update the interface context with the new rates.
  try {
    if (
      !interfaceContext.account?.address ||
      !interfaceContext.transaction ||
      !interfaceContext.scope ||
      !interfaceContext.method
    ) {
      logger.info(`Context is missing required fields`);
      return;
    }

    // Skip transaction simulation if the preference is disabled
    if (!interfaceContext.preferences?.simulateOnChainActions) {
      logger.info(`Transaction simulation is disabled in preferences`);
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

    const [scan, updatedInterfaceContextFinal] = await Promise.all([
      transactionScanService.scanTransaction({
        method: interfaceContext.method,
        accountAddress: interfaceContext.account.address,
        transaction: interfaceContext.transaction,
        scope: interfaceContext.scope,
        origin: interfaceContext.origin,
        account: interfaceContext.account,
      }),
      getInterfaceContextOrThrow<ConfirmTransactionRequestContext>(
        confirmationInterfaceId,
      ),
    ]);

    // Update the current context with the new rates
    const updatedInterfaceContext = {
      ...updatedInterfaceContextFinal,
      scanFetchStatus: 'fetched' as const,
      scan,
    };

    logger.info(`New scan fetched`);

    await updateInterface(
      confirmationInterfaceId,
      <ConfirmTransactionRequest context={updatedInterfaceContext} />,
      updatedInterfaceContext,
    );

    logger.info(`Background event suceeded`);

    // Schedule the next run
    await snap.request({
      method: 'snap_scheduleBackgroundEvent',
      params: {
        duration: 'PT20S',
        request: { method: 'refreshConfirmationEstimation' },
      },
    });
  } catch (error) {
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

    logger.warn(
      { error },
      `Could not update the interface. But rolled back status to fetched.`,
    );
  }
};
