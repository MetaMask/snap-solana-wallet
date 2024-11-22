import { SolMethod } from '@metamask/keyring-api';
import { type UserInputEvent, UserInputEventType } from '@metamask/snaps-sdk';

import { SolanaConnection } from '../../core/services/connection';
import { SolanaKeyring } from '../../core/services/keyring';
import { resolveInterface } from '../../core/utils/interface';
import {
  type TransactionConfirmationContext,
  TransactionConfirmationNames,
} from './components/TransactionConfirmation/types';

/**
 * Checks if the given event comes from the Transaction Confirmation.
 *
 * @param event - The user input event.
 * @returns True if the event is a send confirmation event, false otherwise.
 */
export function isTransactionConfirmationEvent(event: UserInputEvent): boolean {
  return Object.values(TransactionConfirmationNames).includes(
    event?.name as TransactionConfirmationNames,
  );
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
export async function handleTransactionConfirmationEvents({
  id,
  event,
  context,
}: {
  id: string;
  event: UserInputEvent;
  context: TransactionConfirmationContext;
}): Promise<void> {
  const name = event.name as TransactionConfirmationNames;

  const connection = new SolanaConnection();
  const keyring = new SolanaKeyring(connection);

  switch (event.type) {
    case UserInputEventType.ButtonClickEvent:
      switch (name) {
        case TransactionConfirmationNames.Confirm:
          await keyring.submitRequest({
            // eslint-disable-next-line no-restricted-globals
            id: crypto.randomUUID(),
            account: context.fromAccountId,
            scope: context.scope,
            request: {
              method: SolMethod.SendAndConfirmTransaction,
              params: {
                to: context.toAddress,
                amount: Number(context.amount),
              },
            },
          });
          await resolveInterface(id, false);
          break;
        case TransactionConfirmationNames.Cancel:
        case TransactionConfirmationNames.BackButton:
          await resolveInterface(id, false);
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
}
