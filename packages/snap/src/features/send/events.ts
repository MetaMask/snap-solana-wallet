import { type UserInputEvent, UserInputEventType } from '@metamask/snaps-sdk';

import { resolveInterface } from '../../core/utils/interface';
import { SendFormNames } from './types/form';

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
 * @returns Returns null after handling the event.
 */
export async function handleSendEvents({
  id,
  event,
}: {
  id: string;
  event: UserInputEvent;
}): Promise<null> {
  switch (event.type) {
    case UserInputEventType.ButtonClickEvent:
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await handleButtonEvents({ id, name: event.name });
      return null;
    default:
      return null;
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
}: {
  id: string;
  name?: string | undefined;
}): Promise<void | null> {
  switch (name) {
    case SendFormNames.Cancel:
      await resolveInterface(id, false);
      return null;
    default:
      return null;
  }
}
