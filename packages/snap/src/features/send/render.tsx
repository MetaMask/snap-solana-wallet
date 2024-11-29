import { assert } from 'superstruct';

import { createInterface, showDialog } from '../../core/utils/interface';
import { SnapExecutionContext } from '../../index';
import { getSendContext } from './utils/context';
import { StartSendTransactionFlowParamsStruct } from './utils/validation';
import { SendForm } from './views/SendForm/SendForm';
import { type StartSendTransactionFlowParams } from './views/SendForm/types';

/**
 * Renders the send form interface.
 * @param params - The parameters for starting the send transaction flow.
 * @returns A promise that resolves when the interface is created.
 */
export async function renderSend(
  params: StartSendTransactionFlowParams,
  snapContext: SnapExecutionContext,
) {
  assert(params, StartSendTransactionFlowParamsStruct);

  const context = await getSendContext(
    {
      fromAccountId: params.account,
      validation: {},
      scope: params.scope,
    },
    snapContext,
  );

  const id = await createInterface(<SendForm context={context} />, context);

  return showDialog(id);
}
