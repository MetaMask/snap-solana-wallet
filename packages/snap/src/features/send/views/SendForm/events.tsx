import type { InputChangeEvent } from '@metamask/snaps-sdk';
import BigNumber from 'bignumber.js';

import {
  LAMPORTS_PER_SOL,
  SolanaCaip19Tokens,
} from '../../../../core/constants/solana';
import {
  resolveInterface,
  updateInterface,
} from '../../../../core/utils/interface';
import logger from '../../../../core/utils/logger';
import { validateField } from '../../../../core/validation/form';
import { keyring, transferSolHelper } from '../../../../snap-context';
import { Send } from '../../Send';
import { SendCurrency, SendFormNames, type SendContext } from '../../types';
import { validateBalance } from '../../utils/balance';
import { SendForm } from './SendForm';
import { validation } from './validation';

/**
 * Handles the click event for the back button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @returns A promise that resolves when the operation is complete.
 */
async function onBackButtonClick({ id }: { id: string }) {
  await resolveInterface(id, false);
}

/**
 * Handles the change event for the source account selector.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.event - The change event.
 * @param params.context - The send context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onSourceAccountSelectorValueChange({
  id,
  event,
  context,
}: {
  id: string;
  event: InputChangeEvent;
  context: SendContext;
}) {
  context.fromAccountId = event.value as string;

  context.validation[SendFormNames.SourceAccountSelector] =
    validateField<SendFormNames>(
      SendFormNames.SourceAccountSelector,
      context.fromAccountId,
      validation,
    );

  context.validation[SendFormNames.AmountInput] = validateBalance(
    context.amount,
    context,
  );

  await updateInterface(id, <SendForm context={context} />, context);
}

/**
 * Handles the change event for the amount input.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.event - The change event.
 * @param params.context - The send context.
 */
async function onAmountInputChange({
  id,
  event,
  context,
}: {
  id: string;
  event: InputChangeEvent;
  context: SendContext;
}) {
  context.amount = event.value as string;

  context.validation[SendFormNames.AmountInput] = validateField<SendFormNames>(
    SendFormNames.AmountInput,
    context.amount,
    validation,
  );

  context.validation[SendFormNames.AmountInput] =
    context.validation[SendFormNames.AmountInput] ??
    validateBalance(context.amount, context);

  await updateInterface(id, <SendForm context={context} />, context);
}

/**
 * Handles the click event for the swap currency button.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 */
async function onSwapCurrencyButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  context.currencySymbol =
    context.currencySymbol === SendCurrency.SOL
      ? SendCurrency.FIAT
      : SendCurrency.SOL;

  const currentAmount = BigNumber(context.amount ?? '0');
  const price = BigNumber(context.tokenPrices[SolanaCaip19Tokens.SOL].price);

  if (context.currencySymbol === SendCurrency.SOL) {
    /**
     * If we switched to SOL, divide by currency rate
     */
    context.amount = currentAmount.dividedBy(price).toString();
  }

  /**
   * If the currency is USD, adjust the amount
   */
  if (context.currencySymbol === SendCurrency.FIAT) {
    context.amount = currentAmount.multipliedBy(price).toString();
  }

  await updateInterface(id, <SendForm context={context} />, context);
}

/**
 * Handles the click event for the max amount button.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 */
async function onMaxAmountButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  const {
    fromAccountId,
    currencySymbol,
    toAddress,
    balances,
    scope,
    tokenPrices,
  } = context;
  const contextToUpdate = { ...context };
  const account = await keyring.getAccountOrThrow(fromAccountId);
  const balanceInSol = balances[fromAccountId]?.amount ?? '0';

  // NOTE: This calculates the cost of sending SOL specifically.
  // We should adapt if this event ends up being used for SPL tokens as well.
  const costInLamports = await transferSolHelper
    .calculateCostInLamports(account, toAddress, scope)
    .catch((error) => {
      logger.error({ error }, 'Error calculating cost');
      return '0';
    });

  const balanceInLamportsAfterCost = BigNumber(balanceInSol)
    .multipliedBy(LAMPORTS_PER_SOL)
    .minus(costInLamports);

  const balanceInSolAfterCost =
    balanceInLamportsAfterCost.dividedBy(LAMPORTS_PER_SOL);

  if (balanceInSolAfterCost.lt(0)) {
    throw new Error('Insufficient funds');
  }

  contextToUpdate.feeInSol = BigNumber(costInLamports)
    .dividedBy(LAMPORTS_PER_SOL)
    .toString();

  /**
   * If the currency we set is SOL, set the amount to the balance
   */
  if (currencySymbol === SendCurrency.SOL) {
    contextToUpdate.amount = balanceInSolAfterCost.toString();
  }

  /**
   * If the currency is USD, adjust the amount
   */
  if (currencySymbol === SendCurrency.FIAT) {
    const price = BigNumber(tokenPrices[SolanaCaip19Tokens.SOL].price);
    contextToUpdate.amount = balanceInSolAfterCost
      .multipliedBy(price)
      .toString();
  }

  contextToUpdate.validation[SendFormNames.AmountInput] =
    contextToUpdate.validation[SendFormNames.AmountInput] ??
    validateField<SendFormNames>(
      SendFormNames.AmountInput,
      contextToUpdate.amount,
      validation,
    );

  await updateInterface(
    id,
    <SendForm context={contextToUpdate} />,
    contextToUpdate,
  );
}

/**
 * Handles the change event for the destination account input.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.event - The change event.
 * @param params.context - The send context.
 */
async function onDestinationAccountInputValueChange({
  id,
  event,
  context,
}: {
  id: string;
  event: InputChangeEvent;
  context: SendContext;
}) {
  context.toAddress = event.value as string;

  context.validation[SendFormNames.DestinationAccountInput] =
    validateField<SendFormNames>(
      SendFormNames.DestinationAccountInput,
      context.toAddress,
      validation,
    );

  await updateInterface(id, <SendForm context={context} />, context);
}

/**
 * Handles the click event for the clear button.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 */
async function onClearButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  context.toAddress = '';
  await updateInterface(id, <SendForm context={context} />, context);
}

/**
 * Handles the click event for the cancel button.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 */
async function onCancelButtonClick({ id }: { id: string }) {
  await resolveInterface(id, false);
}

/**
 * Handles the click event for the send button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onSendButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  const updatedContext: SendContext = {
    ...context,
    stage: 'transaction-confirmation',
  };

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);
}

export const eventHandlers = {
  [SendFormNames.BackButton]: onBackButtonClick,
  [SendFormNames.SourceAccountSelector]: onSourceAccountSelectorValueChange,
  [SendFormNames.AmountInput]: onAmountInputChange,
  [SendFormNames.SwapCurrencyButton]: onSwapCurrencyButtonClick,
  [SendFormNames.MaxAmountButton]: onMaxAmountButtonClick,
  [SendFormNames.DestinationAccountInput]: onDestinationAccountInputValueChange,
  [SendFormNames.ClearButton]: onClearButtonClick,
  [SendFormNames.CancelButton]: onCancelButtonClick,
  [SendFormNames.SendButton]: onSendButtonClick,
};
