import { SolMethod } from '@metamask/keyring-api';
import BigNumber from 'bignumber.js';

import { SolanaCaip19Tokens } from '../../../../core/constants/solana';
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
  let signature: string | null = null;
  const tokenPrice = context.tokenPrices[SolanaCaip19Tokens.SOL];
  const { price } = tokenPrice;

  const amountInSol =
    context.currencySymbol === SendCurrency.SOL
      ? context.amount
      : BigNumber(context.amount).dividedBy(BigNumber(price)).toString();

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

  const updatedContext: SendContext = {
    ...context,
    transaction: {
      result: signature ? 'success' : 'failure',
      signature,
      tokenPrice,
    },
  };

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);
}

export const eventHandlers = {
  [TransactionConfirmationNames.BackButton]: onBackButtonClick,
  [TransactionConfirmationNames.CancelButton]: onCancelButtonClick,
  [TransactionConfirmationNames.ConfirmButton]: onConfirmButtonClick,
};
