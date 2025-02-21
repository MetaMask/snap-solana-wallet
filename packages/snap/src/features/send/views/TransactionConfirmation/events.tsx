import { SolMethod } from '@metamask/keyring-api';

import {
  resolveInterface,
  updateInterface,
} from '../../../../core/utils/interface';
import logger from '../../../../core/utils/logger';
import { keyring } from '../../../../snapContext';
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

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);
}

/**
 * Handles the click event for the cancel button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @returns A promise that resolves when the operation is complete.
 */
async function onCancelButtonClick({ id }: { id: string }) {
  await resolveInterface(id, false);
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

  // First, show the pending stage
  const contextPending: SendContext = {
    ...context,
    stage: 'send-pending',
  };

  await updateInterface(id, <Send context={contextPending} />, contextPending);

  // Then submit the transaction
  let signature: string | null = null;

  try {
    // Send the transaction message to the keyring over RPC.
    // It will be decoded on the other side, then signed and sent to the network.
    // It MUST be signed on the other side, because the transaction message is stripped of its private keys during encoding, for security reasons.
    // Fees can also be calculated on the other side from the decoded transaction message.
    const response = await keyring.handleSendAndConfirmTransaction({
      id: globalThis.crypto.randomUUID(),
      scope,
      account: fromAccountId, // Will be used to sign the transaction
      request: {
        method: SolMethod.SendAndConfirmTransaction,
        params: {
          base64EncodedTransactionMessage: transactionMessage,
        },
      },
    });

    if (!response) {
      throw new Error('No response');
    }

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
