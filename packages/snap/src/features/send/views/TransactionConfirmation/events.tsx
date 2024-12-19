import BigNumber from 'bignumber.js';

import { Caip19Id } from '../../../../core/constants/solana';
import {
  resolveInterface,
  updateInterface,
} from '../../../../core/utils/interface';
import logger from '../../../../core/utils/logger';
import type { SnapExecutionContext } from '../../../../snap-context';
import { Send } from '../../Send';
import type { SendContext } from '../../types';
import { SendCurrency } from '../../types';
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
 * @param params.snapContext - The snap execution context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onConfirmButtonClick({
  id,
  context,
  snapContext,
}: {
  id: string;
  context: SendContext;
  snapContext: SnapExecutionContext;
}) {
  const {
    fromAccountId,
    toAddress,
    scope,
    currencySymbol,
    tokenPrices,
    amount,
    feeEstimatedInSol,
  } = context;

  // First, show the pending stage
  const contextPending: SendContext = {
    ...context,
    stage: 'send-pending',
  };

  await updateInterface(id, <Send context={contextPending} />, contextPending);

  // Then submit the transaction
  let signature: string | null = null;
  const tokenPrice = tokenPrices[Caip19Id.SolMainnet];
  const { price } = tokenPrice;

  const amountInSol = Number(
    currencySymbol === SendCurrency.SOL
      ? amount
      : BigNumber(amount).dividedBy(BigNumber(price)).toString(),
  );

  try {
    const account = await snapContext.keyring.getAccountOrThrow(fromAccountId);
    const response = await snapContext.transferSolHelper.transferSol(
      account,
      toAddress,
      amountInSol,
      scope,
    );
    signature = response;
  } catch (error) {
    logger.error({ error }, 'Error submitting request');
  }

  const updatedContext: SendContext = {
    ...context,
    stage: signature ? 'transaction-success' : 'transaction-failure',
    feePaidInSol: feeEstimatedInSol,
    transaction: {
      result: signature ? 'success' : 'failure',
      signature,
      tokenPrice,
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
