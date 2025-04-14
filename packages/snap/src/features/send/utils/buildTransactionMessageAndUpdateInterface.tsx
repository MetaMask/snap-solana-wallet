import { parseCaipAssetType } from '@metamask/utils';
import { address, type CompilableTransactionMessage } from '@solana/kit';
import debounce from 'lodash/fp/debounce';
import pipe from 'lodash/fp/pipe';

import { Networks } from '../../../core/constants/solana';
import { fromCompilableTransactionMessageToBase64String } from '../../../core/sdk-extensions/codecs';
import { withoutConcurrency } from '../../../core/utils/concurrency';
import { lamportsToSol } from '../../../core/utils/conversion';
import {
  getInterfaceContextOrThrow,
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
    transactionMessage = await sendSplTokenBuilder.buildTransactionMessage({
      from: account,
      to: address(toAddress),
      mint: address(parseCaipAssetType(tokenCaipId).assetReference),
      amountInToken: tokenAmount,
      network: scope,
    });
  }

  if (!transactionMessage) {
    throw new Error('Unable to generate transaction message');
  }

  const base64EncodedTransactionMessage =
    await fromCompilableTransactionMessageToBase64String(transactionMessage);

  const feeInLamports =
    await transactionHelper.getFeeFromBase64StringInLamports(
      base64EncodedTransactionMessage,
      scope,
    );

  return {
    feeInLamports,
    base64EncodedTransactionMessage,
  };
};

/**
 * Builds a transaction message and performs the various interface updates along with it.
 *
 * WARNING: Do not use this function directly. Use `buildTransactionMessageAndUpdateInterface` instead.
 *
 * @param interfaceId - The interface ID.
 * @param context - The send context.
 * @returns A promise that resolves to the transaction message.
 */
// eslint-disable-next-line camelcase, @typescript-eslint/naming-convention
export const buildTransactionMessageAndUpdateInterface_INTERNAL = async (
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

    const latestContext = await getInterfaceContextOrThrow<SendContext>(
      interfaceId,
    );

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

    const latestContext = await getInterfaceContextOrThrow<SendContext>(
      interfaceId,
    );

    await updateInterface(
      interfaceId,
      <Send context={{ ...latestContext, ...contextUpdatesAfterError }} />,
      { ...latestContext, ...contextUpdatesAfterError },
    );
  }
};

export const buildTransactionMessageAndUpdateInterface = pipe(
  buildTransactionMessageAndUpdateInterface_INTERNAL,
  withoutConcurrency, // Prevent concurrent executions (a new execution cancels the previous)
  debounce(500), // Debounce the function to prevent spamming
);
