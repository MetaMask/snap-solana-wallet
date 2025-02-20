import {
  resolveInterface,
  updateInterface,
} from '../../../../core/utils/interface';
import { Confirmation } from '../../Confirmation';
import { type ConfirmationContext, ConfirmationFormNames } from '../../types';

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
  context: ConfirmationContext;
}) {
  const updatedContext: ConfirmationContext = {
    ...context,
    advanced: {
      ...context.advanced,
      shown: !context.advanced.shown,
    },
  };

  await updateInterface(
    id,
    <Confirmation context={updatedContext} />,
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
}

/**
 * Handles the click event for the confirm button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The ID of the interface to update.
 */
async function onConfirmButtonClick({ id }: { id: string }) {
  await resolveInterface(id, true);
}

export const eventHandlers = {
  [ConfirmationFormNames.ShowAdvanced]: onShowAdvancedButtonClick,
  [ConfirmationFormNames.Cancel]: onCancelButtonClick,
  [ConfirmationFormNames.Confirm]: onConfirmButtonClick,
};
