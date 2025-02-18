import {
  assertIsTransactionMessageWithBlockhashLifetime,
  createKeyPairSignerFromPrivateKeyBytes,
} from '@solana/web3.js';

import { deriveSolanaPrivateKey } from '../../../../core/utils/deriveSolanaPrivateKey';
import {
  resolveInterface,
  updateInterface,
} from '../../../../core/utils/interface';
import { transactionHelper } from '../../../../snapContext';
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
 * @param params.context - The current confirmation context.
 */
async function onConfirmButtonClick({
  id,
  context,
}: {
  id: string;
  context: ConfirmationContext;
}) {
  if (!context.account) {
    throw new Error('Account not found');
  }

  const { privateKeyBytes } = await deriveSolanaPrivateKey(
    context.account.index,
  );
  const signer = await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

  const decodedTransaction = await transactionHelper.base64DecodeTransaction(
    context.transaction,
    context.scope,
  );

  assertIsTransactionMessageWithBlockhashLifetime(decodedTransaction);

  await Promise.all([
    transactionHelper.sendTransaction(
      decodedTransaction,
      [signer],
      context.scope,
    ),
    resolveInterface(id, false),
  ]);
}

export const eventHandlers = {
  [ConfirmationFormNames.ShowAdvanced]: onShowAdvancedButtonClick,
  [ConfirmationFormNames.Cancel]: onCancelButtonClick,
  [ConfirmationFormNames.Confirm]: onConfirmButtonClick,
};
