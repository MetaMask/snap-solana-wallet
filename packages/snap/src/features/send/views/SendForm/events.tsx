import { InputChangeEvent } from '@metamask/snaps-sdk';
import {
  getInterfaceState,
  resolveInterface,
  updateInterface,
} from '../../../../core/utils/interface';
import { validateField } from '../../../../core/validation/form';
import { SnapExecutionContext } from '../../../../index';
import { getSendContext } from '../../utils/context';
import { validation } from '../../utils/validation';
import {
  SendCurrency,
  SendFormNames,
  type SendContext,
  type SendState,
} from '../../views/SendForm/types';
import { TransactionConfirmation } from '../ConfirmationDialog/ConfirmationDialog';
import { TransactionConfirmationContext } from '../ConfirmationDialog/types';
import { SendForm } from './SendForm';

async function onBackButtonClick({ id }: { id: string }) {
  await resolveInterface(id, false);
}

async function onSourceAccountSelectorValueChange({
  id,
  event,
  context,
  snapContext,
}: {
  id: string;
  event: InputChangeEvent;
  context: SendContext;
  snapContext: SnapExecutionContext;
}) {
  const state = (await getInterfaceState(id)) as SendState;
  const newValue = event.value as string;

  context.fromAccountId = newValue;
  context.validation[SendFormNames.SourceAccountSelector] =
    validateField<SendFormNames>(
      SendFormNames.SourceAccountSelector,
      newValue,
      validation,
    );
  context.canReview =
    Object.values(state[SendFormNames.Form]).every(Boolean) &&
    !Object.values(context.validation).every(Boolean);

  const updatedContext = await getSendContext(context, snapContext);

  await updateInterface(
    id,
    <SendForm context={updatedContext} />,
    updatedContext,
  );
}

async function onAmountInputChange({
  id,
  event,
  context,
  snapContext,
}: {
  id: string;
  event: InputChangeEvent;
  context: SendContext;
  snapContext: SnapExecutionContext;
}) {
  // const state = (await getInterfaceState(id)) as SendState;
  const newValue = event.value as string;

  context.amount = newValue;

  // context.validation[SendFormNames.AmountInput] = validateField<SendFormNames>(
  //   SendFormNames.AmountInput,
  //   newValue,
  //   validation,
  // );
  // context.canReview =
  //   Object.values(state[SendFormNames.Form]).every(Boolean) &&
  //   !Object.values(context.validation).every(Boolean);

  const updatedContext = await getSendContext(context, snapContext);

  await updateInterface(
    id,
    <SendForm context={updatedContext} />,
    updatedContext,
  );
}

async function onSwapCurrencyButtonClick({
  id,
  context,
  snapContext,
}: {
  id: string;
  context: SendContext;
  snapContext: SnapExecutionContext;
}) {
  context.currencySymbol =
    context.currencySymbol === SendCurrency.SOL
      ? SendCurrency.FIAT
      : SendCurrency.SOL;

  const updatedContext = await getSendContext(context, snapContext);

  await updateInterface(
    id,
    <SendForm context={updatedContext} />,
    updatedContext,
  );
}

async function onMaxAmountButtonClick({
  id,
  context,
  snapContext,
}: {
  id: string;
  context: SendContext;
  snapContext: SnapExecutionContext;
}) {
  const state = (await getInterfaceState(id)) as SendState;
  context.amount = context.balances[context.fromAccountId]?.amount ?? '0';
  const updatedContext = await getSendContext(context, snapContext);

  context.canReview =
    Object.values(state[SendFormNames.Form]).every(Boolean) &&
    !Object.values(context.validation).every(Boolean);

  await updateInterface(
    id,
    <SendForm context={updatedContext} />,
    updatedContext,
  );
}

async function onDestinationAccountInputValueChange({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  const state = (await getInterfaceState(id)) as SendState;
  const newValue = state[SendFormNames.Form][
    SendFormNames.DestinationAccountInput
  ] as string;

  context.toAddress = newValue;

  context.canReview =
    Object.values(state[SendFormNames.Form]).every(Boolean) &&
    !Object.values(context.validation).every(Boolean);

  await updateInterface(id, <SendForm context={context} />, context);
}

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

async function onCancelButtonClick({ id }: { id: string }) {
  await resolveInterface(id, false);
}

async function onSendButtonClick({
  id,
  context,
  snapContext,
}: {
  id: string;
  context: SendContext;
  snapContext: SnapExecutionContext;
}) {
  const state = (await getInterfaceState(id)) as SendState;

  const fromAddress = (
    await snapContext.keyring.getAccount(context.fromAccountId)
  )?.address as string;
  const toAddress = state[SendFormNames.Form][
    SendFormNames.DestinationAccountInput
  ] as string;
  const amount = state[SendFormNames.Form][SendFormNames.AmountInput] as string;

  const newContext: TransactionConfirmationContext = {
    scope: context.scope,

    fromAccountId: context.fromAccountId,
    fromAddress,
    toAddress,
    amount,
    fee: '0.000005',

    tokenSymbol: 'SOL',
    tokenContractAddress: '',
    tokenPrice: '1',
  };

  await updateInterface(
    id,
    <TransactionConfirmation context={newContext} />,
    newContext,
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
