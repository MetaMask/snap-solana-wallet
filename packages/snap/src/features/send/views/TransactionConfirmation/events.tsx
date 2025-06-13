import { ScheduleBackgroundEventMethod } from '../../../../core/handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import {
  resolveInterface,
  SEND_FORM_INTERFACE_NAME,
  updateInterface,
} from '../../../../core/utils/interface';
import logger from '../../../../core/utils/logger';
import { keyring, state, walletService } from '../../../../snapContext';
import { Send } from '../../Send';
import { type SendContext } from '../../types';
import { TransactionConfirmationNames } from './TransactionConfirmation';

/**
 * Handles the click event for the back button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onBackButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  const updatedContext: SendContext = {
    ...context,
    stage: 'send-form',
  };

  await updateInterface(
    id,
    <Send
      context={updatedContext}
      inputAmount={context.amount ?? ''}
      inputToAddress={context.toAddress ?? ''}
    />,
    updatedContext,
  );
}

/**
 * Handles the click event for the cancel button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onCancelButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  const { fromAccountId, transactionMessage, scope } = context;

  // Trigger the side effects that need to happen when the transaction is rejected
  await snap.request({
    method: 'snap_scheduleBackgroundEvent',
    params: {
      duration: 'PT1S',
      request: {
        method: ScheduleBackgroundEventMethod.OnTransactionRejected,
        params: {
          accountId: fromAccountId,
          base64EncodedTransaction: transactionMessage,
          metadata: {
            scope,
            origin: null,
          },
        },
      },
    },
  });

  await resolveInterface(id, false);
  await state.deleteKey(`mapInterfaceNameToId.${SEND_FORM_INTERFACE_NAME}`);
}

/**
 * Handles the click event for the confirm button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onConfirmButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  const { scope, fromAccountId, feeEstimatedInSol, transactionMessage } =
    context;

  context.error = null;

  if (!transactionMessage) {
    // if we find in this state there is no transaction message, we need to go back to the send form
    context.stage = 'send-form';

    await updateInterface(id, <Send context={context} />, context);
    return;
  }

  await snap.request({
    method: 'snap_scheduleBackgroundEvent',
    params: {
      duration: 'PT1S',
      request: {
        method: ScheduleBackgroundEventMethod.OnTransactionApproved,
        params: {
          accountId: context.fromAccountId,
          base64EncodedTransaction: context.transactionMessage,
          metadata: {
            scope: context.scope,
            origin: null,
          },
        },
      },
    },
  });

  // First, show the pending stage
  const contextPending: SendContext = {
    ...context,
    stage: 'send-pending',
  };

  await updateInterface(id, <Send context={contextPending} />, contextPending);

  // Then submit the transaction
  let signature: string | null = null;

  try {
    const account = await keyring.getAccountOrThrow(fromAccountId);

    const response = await walletService.signAndSendTransaction(
      account,
      transactionMessage,
      scope,
    );

    signature = response.signature;
  } catch (error) {
    logger.error({ error }, 'Error submitting request');
  }

  /**
   * Finally, update context
   */
  const updatedContext: SendContext = {
    ...context,
    stage: signature ? 'transaction-success' : 'transaction-failure',
    feePaidInSol: feeEstimatedInSol,
    transaction: {
      result: signature ? 'success' : 'failure',
      signature,
    },
  };

  // Finally, show the transaction-complete or transaction-failed stage
  await updateInterface(id, <Send context={updatedContext} />, updatedContext);
}

export const eventHandlers = {
  [TransactionConfirmationNames.BackButton]: onBackButtonClick,
  [TransactionConfirmationNames.CancelButton]: onCancelButtonClick,
  [TransactionConfirmationNames.ConfirmButton]: onConfirmButtonClick,
};
