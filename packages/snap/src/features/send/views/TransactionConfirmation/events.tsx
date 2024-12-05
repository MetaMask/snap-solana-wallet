import { SolMethod } from '@metamask/keyring-api';
import BigNumber from 'bignumber.js';

import {
  resolveInterface,
  updateInterface,
} from '../../../../core/utils/interface';
import logger from '../../../../core/utils/logger';
import type { SnapExecutionContext } from '../../../../snap-context';
import { SendForm } from '../SendForm/SendForm';
import { SendCurrency } from '../SendForm/types';
import {
  TransactionConfirmation,
  TransactionConfirmationNames,
} from './TransactionConfirmation';
import type { TransactionConfirmationContext } from './types';

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
  context: TransactionConfirmationContext;
}) {
  await updateInterface(id, <SendForm context={context} />, context);
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
  context: TransactionConfirmationContext;
  snapContext: SnapExecutionContext;
}) {
  let signature: string | null = null;
  const amountInSol =
    context.currencySymbol === SendCurrency.SOL
      ? context.amount
      : BigNumber(context.amount)
          .dividedBy(BigNumber(context.tokenRate.conversionRate))
          .toString();

  try {
    const response = await snapContext.keyring.submitRequest({
      // eslint-disable-next-line no-restricted-globals
      id: crypto.randomUUID(),
      account: context.fromAccountId,
      scope: context.scope,
      request: {
        method: SolMethod.SendAndConfirmTransaction,
        params: {
          to: context.toAddress,
          amount: Number(amountInSol),
        },
      },
    });

    if (
      !(
        !response.pending &&
        response.result &&
        typeof response.result === 'object' &&
        'signature' in response.result
      )
    ) {
      throw new Error('Invalid transaction response');
    }

    signature = response.result.signature as string;
  } catch (error) {
    logger.error({ error }, 'Error submitting request');
  }

  const updatedContext: TransactionConfirmationContext = {
    ...context,
    transaction: {
      result: signature ? 'success' : 'failure',
      signature,
    },
  };

  await updateInterface(
    id,
    <TransactionConfirmation context={updatedContext} />,
    updatedContext,
  );
}

export const eventHandlers = {
  [TransactionConfirmationNames.BackButton]: onBackButtonClick,
  [TransactionConfirmationNames.CancelButton]: onCancelButtonClick,
  [TransactionConfirmationNames.ConfirmButton]: onConfirmButtonClick,
};
