import { address, type CompilableTransactionMessage } from '@solana/web3.js';
import { debounce } from 'lodash';

import { Networks } from '../../../core/constants/solana';
import { lamportsToSol } from '../../../core/utils/conversion';
import { getCaip19Address } from '../../../core/utils/getCaip19Address';
import { updateInterface } from '../../../core/utils/interface';
import logger from '../../../core/utils/logger';
import { sendFieldsAreValid } from '../../../core/validation/form';
import {
  keyring,
  splTokenHelper,
  transactionHelper,
  transferSolHelper,
} from '../../../snapContext';
import { getTokenAmount } from '../selectors';
import { Send } from '../Send';
import { type SendContext } from '../types';

const buildTransactionMessageAndStoreInContext = async (
  id: string,
  context: SendContext,
) => {
  const updatedContext: SendContext = {
    ...context,
  };

  try {
    const { fromAccountId, tokenCaipId, scope, toAddress } = context;
    const account = await keyring.getAccountOrThrow(fromAccountId);
    const tokenAmount = getTokenAmount(context);

    let transactionMessage: CompilableTransactionMessage | null = null;

    if (tokenCaipId === Networks[scope].nativeToken.caip19Id) {
      // Native token (SOL) transaction
      transactionMessage = await transferSolHelper.buildTransactionMessage(
        address(account.address),
        address(toAddress),
        tokenAmount,
        scope,
      );
    } else {
      // SPL token transaction
      transactionMessage = await splTokenHelper.buildTransactionMessage(
        account,
        address(toAddress),
        address(getCaip19Address(tokenCaipId)),
        tokenAmount,
        scope,
      );
    }

    if (!transactionMessage) {
      throw new Error('Unable to generate transaction message');
    }

    const feeInLamports = await transactionHelper.getFeeForMessageInLamports(
      transactionMessage,
      scope,
    );

    updatedContext.transactionMessage =
      await transactionHelper.base64EncodeTransactionMessage(
        transactionMessage,
      );
    updatedContext.feeEstimatedInSol = lamportsToSol(feeInLamports).toString();
  } catch (error) {
    logger.error('Error generating transaction message', error);

    updatedContext.error = {
      title: 'send.simulationTitleError',
      message: 'send.simulationMessageError',
    };

    updatedContext.transactionMessage = null;
  }

  updatedContext.buildingTransaction = false;

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);
};

/**
 * A thottled version to avoid too many successive calls to the function since it's potentially called on every keystroke.
 */
const throttledBuildTransactionMessageAndStoreInContext = debounce(
  buildTransactionMessageAndStoreInContext,
  500,
);

/**
 * If all the send form fields are valid:
 * - Show the loading state on the interface.
 * - Build the transaction message in a debounced fashion.
 * - Store it in the context.
 * - Update the interface with the new context.
 *
 * @param id - The id of the interface.
 * @param context - The send context.
 */
export const buildTxIfValid = async (id: string, context: SendContext) => {
  if (sendFieldsAreValid(context)) {
    const updatedContext: SendContext = {
      ...context,
    };

    // Show the loading state on the interface
    updatedContext.buildingTransaction = true;
    updatedContext.transactionMessage = null;

    /**
     * Doing this here instead of in the throttled call prevents a "laggy" impression on the UI that would be caused by the debounce.
     * We immediately update the UI to show the loading state, even though
     * we in fact wait for the end of the keystrokes to start building the transaction.
     */
    await updateInterface(
      id,
      <Send context={updatedContext} />,
      updatedContext,
    );

    await throttledBuildTransactionMessageAndStoreInContext(id, context);
  }
};
