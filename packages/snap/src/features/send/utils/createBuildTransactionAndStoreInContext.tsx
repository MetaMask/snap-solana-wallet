import { address, type CompilableTransactionMessage } from '@solana/web3.js';

import { Networks } from '../../../core/constants/solana';
import { lamportsToSol } from '../../../core/utils/conversion';
import { getCaip19Address } from '../../../core/utils/getCaip19Address';
import {
  getInterfaceContext,
  updateInterface,
} from '../../../core/utils/interface';
import { sendFieldsAreValid } from '../../../core/validation/form';
import {
  keyring,
  sendSolBuilder,
  sendSplTokenBuilder,
  transactionHelper,
} from '../../../snapContext';
import { getTokenAmount } from '../selectors';
import { Send } from '../Send';
import { type SendContext } from '../types';
import { withCancellable, withoutConcurrency } from './concurrency';

/**
 * Builds a transaction message for the send form.
 *
 * @param context - The send context.
 * @returns A promise that resolves to the transaction message.
 */
const buildTransactionMessage = async (context: SendContext) => {
  const { fromAccountId, tokenCaipId, scope, toAddress } = context;
  const tokenAmount = getTokenAmount(context);
  const account = await keyring.getAccountOrThrow(fromAccountId);

  let transactionMessage: CompilableTransactionMessage | null = null;

  if (tokenCaipId === Networks[scope].nativeToken.caip19Id) {
    // Native token (SOL) transaction
    transactionMessage = await sendSolBuilder.buildTransactionMessage(
      address(account.address),
      address(toAddress),
      tokenAmount,
      scope,
    );
  } else {
    // SPL token transaction
    transactionMessage = await sendSplTokenBuilder.buildTransactionMessage(
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

  const feeInLamports = await transactionHelper.getFeeFromTransactionInLamports(
    transactionMessage,
    scope,
  );

  const base64EncodedTransactionMessage =
    await transactionHelper.base64EncodeTransaction(transactionMessage);

  return {
    feeInLamports,
    base64EncodedTransactionMessage,
  };
};

const _buildTransactionMessageAndUpdateInterface = async (
  interfaceId: string,
  context: SendContext,
) => {
  try {
    if (!sendFieldsAreValid(context)) {
      return;
    }

    const contextUpdatesInitial: Partial<SendContext> = {
      buildingTransaction: true,
      transactionMessage: null,
      feeEstimatedInSol: null,
    };

    await updateInterface(
      interfaceId,
      <Send context={{ ...context, ...contextUpdatesInitial }} />,
      { ...context, ...contextUpdatesInitial },
    );

    const { feeInLamports, base64EncodedTransactionMessage } =
      await buildTransactionMessage(context);

    const contextUpdatesAfterBuild: Partial<SendContext> = {
      transactionMessage: base64EncodedTransactionMessage,
      feeEstimatedInSol: feeInLamports
        ? lamportsToSol(feeInLamports).toString()
        : null,
      buildingTransaction: false,
    };

    const latestContext = (await getInterfaceContext(
      interfaceId,
    )) as SendContext;

    await updateInterface(
      interfaceId,
      <Send context={{ ...latestContext, ...contextUpdatesAfterBuild }} />,
      { ...latestContext, ...contextUpdatesAfterBuild },
    );
  } catch (error) {
    const contextUpdatesAfterError: Partial<SendContext> = {
      error: {
        title: 'send.simulationTitleError',
        message: 'send.simulationMessageError',
      },
      transactionMessage: null,
      feeEstimatedInSol: null,
      buildingTransaction: false,
    };

    const latestContext = (await getInterfaceContext(
      interfaceId,
    )) as SendContext;

    await updateInterface(
      interfaceId,
      <Send context={{ ...latestContext, ...contextUpdatesAfterError }} />,
      { ...latestContext, ...contextUpdatesAfterError },
    );
  }
};

export const buildTransactionMessageAndUpdateInterface = withoutConcurrency(
  withCancellable(_buildTransactionMessageAndUpdateInterface),
);
