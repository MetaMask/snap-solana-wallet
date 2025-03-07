/* eslint-disable no-void */
import type { CaipAssetType } from '@metamask/keyring-api';
import type { InputChangeEvent } from '@metamask/snaps-sdk';
import BigNumber from 'bignumber.js';

import {
  Networks,
  SOL_TRANSFER_FEE_LAMPORTS,
} from '../../../../core/constants/solana';
import { CronjobMethod } from '../../../../core/handlers/onCronjob';
import {
  lamportsToSol,
  solToLamports,
} from '../../../../core/utils/conversion';
import {
  resolveInterface,
  SEND_FORM_INTERFACE_NAME,
  updateInterface,
} from '../../../../core/utils/interface';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import { validateField } from '../../../../core/validation/form';
import { state, tokenPricesService } from '../../../../snapContext';
import { Send } from '../../Send';
import { SendCurrencyType, SendFormNames, type SendContext } from '../../types';
import { buildTransactionMessageAndUpdateInterface } from '../../utils/buildTransactionMessageAndUpdateInterface';
import { validateBalance } from '../../utils/validateBalance';
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
  await state.update((_state) => {
    delete _state?.mapInterfaceNameToId?.[SEND_FORM_INTERFACE_NAME];

    return _state;
  });
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
  context.error = null;
  context.validation[SendFormNames.SourceAccountSelector] =
    validateField<SendFormNames>(
      SendFormNames.SourceAccountSelector,
      context.fromAccountId,
      validation(context),
    );

  context.validation[SendFormNames.AmountInput] = validateBalance(
    context.amount,
    context,
  );

  await updateInterface(id, <Send context={context} />, context);

  await buildTransactionMessageAndUpdateInterface(id, context);
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
  context.error = null;
  context.validation[SendFormNames.AmountInput] = validateField<SendFormNames>(
    SendFormNames.AmountInput,
    context.amount,
    validation(context),
  );

  context.validation[SendFormNames.AmountInput] =
    context.validation[SendFormNames.AmountInput] ??
    validateBalance(context.amount, context);

  await updateInterface(id, <Send context={context} />, context);

  await buildTransactionMessageAndUpdateInterface(id, context);
}

/**
 * Handles the change event for the asset selector.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.event - The change event.
 * @param params.context - The send context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onAssetSelectorValueChange({
  id,
  event,
  context,
}: {
  id: string;
  event: InputChangeEvent;
  context: SendContext;
}) {
  context.tokenCaipId = event.value as CaipAssetType;
  context.amount = '';
  context.error = null;

  await updateInterface(id, <Send context={context} />, context);

  await buildTransactionMessageAndUpdateInterface(id, context);
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
  context.error = null;
  context.currencyType =
    context.currencyType === SendCurrencyType.TOKEN
      ? SendCurrencyType.FIAT
      : SendCurrencyType.TOKEN;

  if (!context.amount) {
    // if the amount is empty we dont need to update amount
    await updateInterface(id, <Send context={context} />, context);
    return;
  }

  const currentAmount = BigNumber(context.amount ?? '0');

  const { price } = context.tokenPrices[context.tokenCaipId] ?? { price: 0 };

  // If we switched to TOKEN, divide by currency rate
  if (context.currencyType === SendCurrencyType.TOKEN) {
    context.amount = currentAmount.dividedBy(price).toString();
  }

  // If the currency is USD, adjust the amount
  if (context.currencyType === SendCurrencyType.FIAT) {
    context.amount = currentAmount.multipliedBy(price).toString();
  }

  await updateInterface(id, <Send context={context} />, context);
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
  const { fromAccountId, currencyType, balances, tokenCaipId, scope } = context;
  const updatedContext: SendContext = { ...context };
  const tokenBalance = balances[fromAccountId]?.[tokenCaipId]?.amount ?? '0';
  const isNativeToken = tokenCaipId === Networks[scope].nativeToken.caip19Id;

  if (isNativeToken) {
    // For a SOL transaction, we need to subtract the transfer fee
    const balanceInLamportsAfterCost = solToLamports(tokenBalance).minus(
      SOL_TRANSFER_FEE_LAMPORTS,
    );

    const balanceInSolAfterCost = lamportsToSol(balanceInLamportsAfterCost);
    updatedContext.amount = balanceInSolAfterCost.toString();
  } else {
    updatedContext.amount = tokenBalance;
  }

  if (currencyType === SendCurrencyType.FIAT) {
    const { price } = context.tokenPrices[context.tokenCaipId] ?? { price: 0 };
    updatedContext.amount = tokenToFiat(updatedContext.amount, price);
  }

  updatedContext.error = null;

  updatedContext.validation[SendFormNames.AmountInput] =
    validateField<SendFormNames>(
      SendFormNames.AmountInput,
      updatedContext.amount,
      validation(updatedContext),
    );

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);

  await buildTransactionMessageAndUpdateInterface(id, updatedContext);
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
  context.error = null;
  context.validation[SendFormNames.DestinationAccountInput] =
    validateField<SendFormNames>(
      SendFormNames.DestinationAccountInput,
      context.toAddress,
      validation(context),
    );

  await updateInterface(id, <Send context={context} />, context);

  await buildTransactionMessageAndUpdateInterface(id, context);
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
  context.error = null;
  await updateInterface(id, <Send context={context} />, context);
}

/**
 * Handles the click event for the cancel button.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 */
async function onCancelButtonClick({ id }: { id: string }) {
  await resolveInterface(id, false);
  await state.update((_state) => {
    delete _state?.mapInterfaceNameToId?.[SEND_FORM_INTERFACE_NAME];

    return _state;
  });
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
  const updatedContext: SendContext = { ...context };
  updatedContext.stage = 'transaction-confirmation';

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);

  const tokenPrices = await tokenPricesService
    .getMultipleTokenPrices(context.assets, context.preferences.currency)
    .then((prices) => prices)
    .catch(() => null);

  if (tokenPrices) {
    updatedContext.tokenPrices = tokenPrices;
  }

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);

  // Trigger the side effects that need to happen when the transaction is shown in confirmation UI
  void snap.request({
    method: 'snap_scheduleBackgroundEvent',
    params: {
      duration: 'PT1S',
      request: {
        method: CronjobMethod.OnTransactionAdded,
        params: {
          accountId: context.fromAccountId,
          base64EncodedTransactionMessage: context.transactionMessage,
          scope: context.scope,
        },
      },
    },
  });
}

export const eventHandlers = {
  [SendFormNames.BackButton]: onBackButtonClick,
  [SendFormNames.SourceAccountSelector]: onSourceAccountSelectorValueChange,
  [SendFormNames.AmountInput]: onAmountInputChange,
  [SendFormNames.AssetSelector]: onAssetSelectorValueChange,
  [SendFormNames.SwapCurrencyButton]: onSwapCurrencyButtonClick,
  [SendFormNames.MaxAmountButton]: onMaxAmountButtonClick,
  [SendFormNames.DestinationAccountInput]: onDestinationAccountInputValueChange,
  [SendFormNames.ClearButton]: onClearButtonClick,
  [SendFormNames.CancelButton]: onCancelButtonClick,
  [SendFormNames.SendButton]: onSendButtonClick,
};
