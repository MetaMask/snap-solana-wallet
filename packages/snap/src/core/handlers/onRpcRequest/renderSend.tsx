import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { assert } from 'superstruct';

import { Send } from '../../../features/send/Send';
import { buildSendContext } from '../../../features/send/utils/buildSendContext';
import { StartSendTransactionFlowParamsStruct } from '../../../features/send/views/SendForm/validation';
import { state, tokenPricesService } from '../../../snap-context';
import {
  createInterface,
  SEND_FORM_INTERFACE_NAME,
  showDialog,
} from '../../utils/interface';

/**
 * Renders the send form interface.
 *
 * @param params - The parameters for rendering the send form interface.
 * @param params.request - The request object.
 * @returns A promise that resolves when the interface is created.
 */
export const renderSend: OnRpcRequestHandler = async ({ request }) => {
  const { params } = request;
  assert(params, StartSendTransactionFlowParamsStruct);

  const { scope, account } = params;

  await tokenPricesService.refreshPrices();

  const context = await buildSendContext(scope, account);

  const id = await createInterface(<Send context={context} />, context);

  // Save the interface id to the state
  await state.update((_state) => {
    return {
      ..._state,
      mapInterfaceNameToId: {
        ...(_state?.mapInterfaceNameToId ?? {}),
        [SEND_FORM_INTERFACE_NAME]: id,
      },
    };
  });

  return showDialog(id);
};
