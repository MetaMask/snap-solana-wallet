import { SolMethod } from '@metamask/keyring-api';
import { type UserInputEvent } from '@metamask/snaps-sdk';

import { SnapExecutionContext } from 'src';
import {
  resolveInterface,
  updateInterface,
} from '../../../../core/utils/interface';
import {
  type TransactionConfirmationContext,
  TransactionConfirmationNames,
} from './types';
import { TransactionResultDialog } from '../TransactionResultDialog/TransactionResultDialog';

async function onBackButtonClick({
  id,
  event,
  context,
  snapContext,
}: {
  id: string;
  event: UserInputEvent;
  context: TransactionConfirmationContext;
  snapContext: SnapExecutionContext;
}) {
  // const newContext = JSON.parse(context.sendFormContext);
  // await updateInterface(id, <SendForm context={newContext} />, context);
}

async function onCancelButtonClick({ id }: { id: string }) {
  await resolveInterface(id, false);
}

async function onConfirmButtonClick({
  id,
  context,
  snapContext,
}: {
  id: string;
  context: TransactionConfirmationContext;
  snapContext: SnapExecutionContext;
}) {
  const response = await snapContext.keyring.submitRequest({
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

  const signature =
    !response.pending &&
    response.result !== null &&
    typeof response.result === 'object' &&
    'signature' in response.result
      ? (response.result.signature as string)
      : null;

  await updateInterface(
    id,
    <TransactionResultDialog
      transactionSuccess={signature !== null}
      signature={signature}
    />,
    context,
  );
}

export const eventHandlers = {
  [TransactionConfirmationNames.BackButton]: onBackButtonClick,
  [TransactionConfirmationNames.CancelButton]: onCancelButtonClick,
  [TransactionConfirmationNames.ConfirmButton]: onConfirmButtonClick,
};
