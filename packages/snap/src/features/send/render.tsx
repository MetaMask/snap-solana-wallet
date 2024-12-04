import { assert } from 'superstruct';

import { createInterface, showDialog } from '../../core/utils/interface';
import type { SnapExecutionContext } from '../../snap-context';
import { getSendContext } from './utils/context';
import { SendForm } from './views/SendForm/SendForm';
import type { StartSendTransactionFlowParams } from './views/SendForm/types';
import { StartSendTransactionFlowParamsStruct } from './views/SendForm/validation';

/**
 * Renders the send form interface.
 * @param params - The parameters for starting the send transaction flow.
 * @param snapContext - The snap execution context.
 * @returns A promise that resolves when the interface is created.
 */
export async function renderSend(
  params: StartSendTransactionFlowParams,
  snapContext: SnapExecutionContext,
) {
  assert(params, StartSendTransactionFlowParamsStruct);

  const { state, tokenRatesController } = snapContext;

  // TODO: Do we do this? 🤔
  await tokenRatesController.refreshTokenRates();

  const context = await getSendContext(
    {
      fromAccountId: params.account,
      validation: {},
      scope: params.scope,
    },
    snapContext,
  );

  const id = await createInterface(<SendForm context={context} />, context);

  // Save the interface id to the state
  await state.update((_state) => {
    return {
      ..._state,
      mapInterfaceNameToId: {
        ...(_state?.mapInterfaceNameToId ?? {}),
        'send-form': id, // TODO: Static key? Enum?
      },
    };
  });

  return showDialog(id);
}
