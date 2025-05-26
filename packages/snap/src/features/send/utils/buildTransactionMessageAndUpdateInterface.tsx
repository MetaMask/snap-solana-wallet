import { parseCaipAssetType } from '@metamask/utils';
import { address } from '@solana/kit';
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
import logger from '../../../core/utils/logger';
import {
  keyring,
  sendSolBuilder,
  sendSplTokenBuilder,
} from '../../../snapContext';
import { getTokenAmount } from '../selectors';
import { Send } from '../Send';
import { SendFeeCalculator } from '../transactions/SendFeeCalculator';
import { type SendContext } from '../types';
import { sendFieldsAreValid } from '../validation/form';

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

  if (!toAddress || !tokenAmount) {
    throw new Error('Invalid transaction parameters');
  }

  const isNative = tokenCaipId === Networks[scope].nativeToken.caip19Id;

  const builder = isNative ? sendSolBuilder : sendSplTokenBuilder;
  const feeCalculator = new SendFeeCalculator(builder);

  const params = {
    from: account,
    to: address(toAddress),
    amount: tokenAmount,
    network: scope,
    ...(isNative
      ? {}
      : { mint: address(parseCaipAssetType(tokenCaipId).assetReference) }),
  };

  const transactionMessage = await builder.buildTransactionMessage(params);

  const base64EncodedTransactionMessage =
    await fromCompilableTransactionMessageToBase64String(transactionMessage);

  const feeInLamports = feeCalculator.getFee();

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
    logger.error('Could not build the send transaction', error);

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
