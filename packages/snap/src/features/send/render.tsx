import { assert } from 'superstruct';

import { SolanaState } from '../../core/services/state';
import { showDialog, createInterface } from '../../core/utils/interface';
import { SendForm } from './components/SendForm/SendForm';
import type { SendContext, StartSendTransactionFlowParams } from './types/send';
import { StartSendTransactionFlowParamsStruct } from './utils/validation';

/**
 * Renders the send form interface.
 * @param params - The parameters for starting the send transaction flow.
 * @returns A promise that resolves when the interface is created.
 */
export async function renderSend(params: StartSendTransactionFlowParams) {
  assert(params, StartSendTransactionFlowParamsStruct);

  const state = new SolanaState();
  const currentState = await state.get();

  const context: SendContext = {
    scope: params.scope,
    accounts: Object.values(currentState?.keyringAccounts ?? {}),
    selectedAccountId: params.account,
    validation: {},
    clearToField: false,
  };

  const id = await createInterface(<SendForm 
    context={context}
    />, context);

  return showDialog(id);
}
