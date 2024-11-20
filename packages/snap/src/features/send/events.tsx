import { type UserInputEvent, UserInputEventType } from '@metamask/snaps-sdk';

import {
  getInterfaceState,
  resolveInterface,
  updateInterface,
} from '../../core/utils/interface';
import { validateField } from '../../core/validation/form';
import { SendForm } from './components/SendForm/SendForm';
import { SendFormNames } from './types/form';
import type { SendContext, SendState } from './types/send';
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
 * @param params.id - The ID associated with the event.
 * @param params.event - The user input event.
 * @param params.context - The context for the send event.
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

  context.clearToField = false;
  
  console.log(
    'Context: ', context,
    'State: ', state,
  )
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
  const formState = state[SendFormNames.Form];
  const fieldName = name as SendFormNames;
  const fieldValue = formState[fieldName] as string;

  context.validation[fieldName] = validateField<SendFormNames>(
    fieldName,
    fieldValue,
    validation,
  );

  switch (name) {
    case SendFormNames.AccountSelector:
      if (!context.validation[SendFormNames.AccountSelector]) {
        break;
      }

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
 * @param [params.name] - The name of the button event.
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
    case SendFormNames.Clear:
      context.clearToField = true;
      await updateInterface(id, <SendForm context={context} />, context);
      break;
    default:
      return null;
  }
}
