import type { InputChangeEvent } from '@metamask/snaps-sdk';
import BigNumber from 'bignumber.js';

import {
  resolveInterface,
  updateInterface,
} from '../../../../core/utils/interface';
import { validateField } from '../../../../core/validation/form';
import { TransactionConfirmation } from '../ConfirmationDialog/ConfirmationDialog';
import { SendForm } from './SendForm';
import { SendCurrency, SendFormNames, type SendContext } from './types';
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
  const conversionRate = BigNumber(context.rates?.conversionRate ?? '0');

  if (context.currencySymbol === SendCurrency.SOL) {
    /**
     * If we switched to SOL, divide by currency rate
     */
    context.amount = currentAmount.dividedBy(conversionRate).toString();
  }

  /**
   * If the currency is USD, adjust the amount
   */
  if (context.currencySymbol === SendCurrency.FIAT) {
    context.amount = currentAmount.multipliedBy(conversionRate).toString();
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
  /**
   * If the currency we set is SOL, set the amount to the balance
   */
  if (context.currencySymbol === SendCurrency.SOL) {
    context.amount = context.balances[context.fromAccountId]?.amount ?? '0';
  }

  /**
   * If the currency is USD, adjust the amount
   */
  if (context.currencySymbol === SendCurrency.FIAT) {
    const amount = BigNumber(
      context.balances[context.fromAccountId]?.amount ?? '0',
    );
    const conversionRate = BigNumber(context.rates?.conversionRate ?? '0');

    context.amount = amount.multipliedBy(conversionRate).toString();
  }

  context.validation[SendFormNames.AmountInput] = validateField<SendFormNames>(
    SendFormNames.AmountInput,
    context.amount,
    validation,
  );

  await updateInterface(id, <SendForm context={context} />, context);
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
  await updateInterface(
    id,
    <TransactionConfirmation context={context} />,
    context,
  );
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
