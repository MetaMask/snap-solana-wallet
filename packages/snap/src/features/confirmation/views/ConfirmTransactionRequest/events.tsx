import {
  CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME,
  resolveInterface,
  updateInterface,
} from '../../../../core/utils/interface';
import { state } from '../../../../snapContext';
import { ConfirmTransactionRequest } from './ConfirmTransactionRequest';
import type { ConfirmTransactionRequestContext } from './types';

/**
 * Handles the click event for the show advanced button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The ID of the interface to update.
 * @param params.context - The current confirmation context.
 */
async function onShowAdvancedButtonClick({
  id,
  context,
}: {
  id: string;
  context: ConfirmTransactionRequestContext;
}) {
  const updatedContext: ConfirmTransactionRequestContext = {
    ...context,
    advanced: {
      ...context.advanced,
      shown: !context.advanced.shown,
    },
  };

  await updateInterface(
    id,
    <ConfirmTransactionRequest context={updatedContext} />,
    updatedContext,
  );
}

/**
 * Handles the click event for the cancel button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The ID of the interface to update.
 */
async function onCancelButtonClick({ id }: { id: string }) {
  await resolveInterface(id, false);
  await state.deleteKey(
    `mapInterfaceNameToId.${CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME}`,
  );
}

/**
 * Handles the click event for the confirm button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The ID of the interface to update.
 */
async function onConfirmButtonClick({ id }: { id: string }) {
  await resolveInterface(id, true);
  await state.deleteKey(
    `mapInterfaceNameToId.${CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME}`,
  );
}

export enum ConfirmSignAndSendTransactionFormNames {
  ShowAdvanced = 'confirm-sign-and-send-transaction-show-advanced',
  Cancel = 'confirm-sign-and-send-transaction-cancel',
  Confirm = 'confirm-sign-and-send-transaction-confirm',
}

export const eventHandlers = {
  [ConfirmSignAndSendTransactionFormNames.ShowAdvanced]:
    onShowAdvancedButtonClick,
  [ConfirmSignAndSendTransactionFormNames.Cancel]: onCancelButtonClick,
  [ConfirmSignAndSendTransactionFormNames.Confirm]: onConfirmButtonClick,
};
