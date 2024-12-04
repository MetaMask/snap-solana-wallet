import { UserInputEventType, type UserInputEvent } from '@metamask/snaps-sdk';

import {
  getInterfaceState,
  resolveInterface,
  updateInterface,
} from '../../core/utils/interface';
import { validateField } from '../../core/validation/form';
import { SendForm } from './components/SendForm/SendForm';
import { SendFormNames } from './types/form';
import { SendCurrency, type SendContext, type SendState } from './types/send';
import { validateBalance } from './utils/balance';
import { getSendContext } from './utils/context';
import { validation } from './utils/validation';

/**
 * Checks if the given event is a send event.
 *
 * @param event - The user input event.
 * @returns True if the event is a send event, false otherwise.
 */
export function isSendFormEvent(event: UserInputEvent): boolean {
  return Object.values(SendFormNames).includes(event?.name as SendFormNames);
}

/**
 * Handles send events based on the provided event type.
 *
 * @param params - The parameters for the function.
 * @param params.context - The context for the send event.
 * @param params.id - The ID associated with the event.
 * @param params.event - The user input event.
 * @returns Returns null after handling the event.
 */
export async function handleSendEvents({
  id,
  event,
  context,
}: {
  id: string;
  event: UserInputEvent;
  context: SendContext;
}): Promise<void> {
  const state = (await getInterfaceState(id)) as SendState;
  const name = event.name as SendFormNames;

  const formState = state[SendFormNames.Form];

  // validate only the field that has changed
  Object.keys(formState).forEach((key) => {
    const fieldName = key as SendFormNames;
    const fieldValue = formState[fieldName] as string;
    if (formState[fieldName] === null) {
      context.validation[fieldName] = context.validation[fieldName] ?? null;
    } else {
      context.validation[fieldName] = validateField<SendFormNames>(
        fieldName,
        fieldValue,
        validation,
      );
    }
  });

  // the form can only review if all fields are filled and valid
  context.canReview =
    Object.values(formState).every(Boolean) &&
    !Object.values(context.validation).every(Boolean);

  switch (event.type) {
    case UserInputEventType.ButtonClickEvent:
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await handleButtonEvents({ id, name, context });
      break;
    case UserInputEventType.InputChangeEvent:
      await handleInputChangeEvents({
        id,
        name,
        state,
        context,
      });
      break;
    default:
      break;
  }
}

/**
 * Handles input change events based on the provided name and state.
 *
 * @param params - The parameters for the function.
 * @param params.id - The ID associated with the event.
 * @param [params.name] - The name of the input change event.
 * @param params.state - The state of the interface.
 * @param params.context - The context for the send event.
 * @returns Returns null after handling the event.
 */
async function handleInputChangeEvents({
  id,
  name,
  state,
  context,
}: {
  id: string;
  name?: SendFormNames | undefined;
  state: SendState;
  context: SendContext;
}): Promise<void> {
  const toAddress = state[SendFormNames.Form][SendFormNames.To];
  const formState = state[SendFormNames.Form];
  const fieldName = name as SendFormNames;
  const fieldValue = formState[fieldName] as string;

  switch (name) {
    case SendFormNames.AccountSelector:
    case SendFormNames.AmountInput:
      if (name === SendFormNames.AccountSelector) {
        context.selectedAccountId = fieldValue;
      }

      if (fieldName === SendFormNames.AmountInput) {
        context.validation[fieldName] =
          context.validation[fieldName] ?? validateBalance(fieldValue, context);
      }

      // eslint-disable-next-line no-case-declarations
      const updatedContext = await getSendContext(context);

      await updateInterface(
        id,
        <SendForm context={updatedContext} />,
        updatedContext,
      );
      break;
    case SendFormNames.To:
      context.showClearButton = Boolean(toAddress);

      await updateInterface(id, <SendForm context={context} />, context);

      break;
    default:
      break;
  }
}

/**
 * Handles button events based on the provided name.
 *
 * @param params - The parameters for the function.
 * @param params.id - The ID associated with the event.
 * @param params.context - The context for the send event.
 * @param params.name - The name of the button event.
 * @returns Returns null after handling the event.
 */
async function handleButtonEvents({
  id,
  name,
  context,
}: {
  id: string;
  name?: string | undefined;
  context: SendContext;
}): Promise<void | null> {
  switch (name) {
    case SendFormNames.Cancel:
    case SendFormNames.BackButton:
      await resolveInterface(id, false);
      return null;

    case SendFormNames.SwapCurrency:
    case SendFormNames.Clear:
    case SendFormNames.AmountInputMax:
      if (name === SendFormNames.SwapCurrency) {
        context.currencySymbol =
          context.currencySymbol === SendCurrency.SOL
            ? SendCurrency.FIAT
            : SendCurrency.SOL;
      }

      if (name === SendFormNames.AmountInputMax) {
        context.maxBalance = true;
      }

      if (name === SendFormNames.Clear) {
        context.clearToField = true;
        context.showClearButton = false;
      }

      // eslint-disable-next-line no-case-declarations
      const updatedContext = await getSendContext(context);

      await updateInterface(
        id,
        <SendForm context={updatedContext} />,
        updatedContext,
      );
      return null;
    default:
      return null;
  }
}
