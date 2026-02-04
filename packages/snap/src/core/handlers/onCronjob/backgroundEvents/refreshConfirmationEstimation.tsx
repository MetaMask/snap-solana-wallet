import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { ConfirmTransactionRequest } from '../../../../features/confirmation/views/ConfirmTransactionRequest/ConfirmTransactionRequest';
import type { ConfirmTransactionRequestContext } from '../../../../features/confirmation/views/ConfirmTransactionRequest/types';
import { state, transactionScanService } from '../../../../snapContext';
import { serialize } from '../../../serialization/serialize';
import type { UnencryptedStateValue } from '../../../services/state/State';
import {
  CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME,
  getInterfaceContextIfExists,
  updateInterfaceIfExists,
} from '../../../utils/interface';
import baseLogger, { createPrefixedLogger } from '../../../utils/logger';

async function deleteInterfaceIdIfCurrent(interfaceId: string) {
  const currentMap =
    (await state.getKey<UnencryptedStateValue['mapInterfaceNameToId']>(
      'mapInterfaceNameToId',
    )) ?? {};
  if (
    currentMap[CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME] ===
    interfaceId
  ) {
    await state.deleteKey(
      `mapInterfaceNameToId.${CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME}`,
    );
  }
}

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

  // Check if context exists in case the UI was closed before the background event ran
  const interfaceContext =
    await getInterfaceContextIfExists<ConfirmTransactionRequestContext>(
      confirmationInterfaceId,
    );

  if (!interfaceContext) {
    logger.info(`Interface context no longer exists, cleaning up state`);
    await deleteInterfaceIdIfCurrent(confirmationInterfaceId);
    return;
  }

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

    const fetchingUpdated = await updateInterfaceIfExists(
      confirmationInterfaceId,
      <ConfirmTransactionRequest
        context={serialize(fetchingConfirmationContext) as any}
      />,
      fetchingConfirmationContext,
    );

    if (!fetchingUpdated) {
      logger.info(`Interface dismissed, cleaning up state`);
      await deleteInterfaceIdIfCurrent(confirmationInterfaceId);
      return;
    }

    const [scan, updatedInterfaceContextFinal] = await Promise.all([
      transactionScanService.scanTransaction({
        method: interfaceContext.method,
        accountAddress: interfaceContext.account.address,
        transaction: interfaceContext.transaction,
        scope: interfaceContext.scope,
        origin: interfaceContext.origin,
        account: interfaceContext.account,
      }),
      getInterfaceContextIfExists<ConfirmTransactionRequestContext>(
        confirmationInterfaceId,
      ),
    ]);

    // Check if context exists in case the UI was closed while scanning
    if (!updatedInterfaceContextFinal) {
      logger.info(
        `Interface context no longer exists after scan, cleaning up state`,
      );
      await deleteInterfaceIdIfCurrent(confirmationInterfaceId);
      return;
    }

    // Update the current context with the new rates
    const updatedInterfaceContext = {
      ...updatedInterfaceContextFinal,
      scanFetchStatus: 'fetched' as const,
      scan,
    };
    logger.info(`New scan fetched`);

    const scanUpdated = await updateInterfaceIfExists(
      confirmationInterfaceId,
      <ConfirmTransactionRequest
        context={serialize(updatedInterfaceContext) as any}
      />,
      updatedInterfaceContext,
    );

    if (!scanUpdated) {
      logger.info(`Interface dismissed after scan, cleaning up state`);
      await deleteInterfaceIdIfCurrent(confirmationInterfaceId);
      return;
    }

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
    // Check if context exists in case the UI was closed, nothing to rollback
    const fetchedInterfaceContext =
      await getInterfaceContextIfExists<ConfirmTransactionRequestContext>(
        confirmationInterfaceId,
      );

    if (!fetchedInterfaceContext) {
      logger.info(`Interface context no longer exists, cleaning up state`);
      await deleteInterfaceIdIfCurrent(confirmationInterfaceId);
      return;
    }

    const fetchingConfirmationContext = {
      ...fetchedInterfaceContext,
      scanFetchStatus: 'fetched',
    } as ConfirmTransactionRequestContext;

    await updateInterfaceIfExists(
      confirmationInterfaceId,
      <ConfirmTransactionRequest
        context={serialize(fetchingConfirmationContext) as any}
      />,
      fetchingConfirmationContext,
    );

    logger.warn(
      { error },
      `Could not update the interface. But rolled back status to fetched.`,
    );
  }
};
