import { assert } from 'superstruct';

import { createInterface, showDialog } from '../../core/utils/interface';
import { SendForm } from './components/SendForm/SendForm';
import { type StartSendTransactionFlowParams } from './types/send';
import { getSendContext } from './utils/context';
import { StartSendTransactionFlowParamsStruct } from './utils/validation';

/**
 * Renders the send form interface.
 * @param params - The parameters for starting the send transaction flow.
 * @returns A promise that resolves when the interface is created.
 */
export async function renderSend(params: StartSendTransactionFlowParams) {
  assert(params, StartSendTransactionFlowParamsStruct);

  const context = await getSendContext({
    selectedAccountId: params.account,
    validation: {},
    clearToField: false,
    showClearButton: false,
    scope: params.scope,
  });

  const id = await createInterface(<SendForm context={context} />, context);

  return showDialog(id);
}
