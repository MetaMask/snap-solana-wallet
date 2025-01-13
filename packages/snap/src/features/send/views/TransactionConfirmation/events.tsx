import { SolMethod } from '@metamask/keyring-api';
import { address } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

import { Caip19Id } from '../../../../core/constants/solana';
import {
  resolveInterface,
  updateInterface,
} from '../../../../core/utils/interface';
import logger from '../../../../core/utils/logger';
import {
  keyring,
  transactionHelper,
  transferSolHelper,
  type SnapExecutionContext,
} from '../../../../snapContext';
import { Send } from '../../Send';
import type { SendContext } from '../../types';
import { SendCurrency } from '../../types';
import { TransactionConfirmationNames } from './TransactionConfirmation';

/**
 * Handles the click event for the back button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onBackButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  const updatedContext: SendContext = {
    ...context,
    stage: 'send-form',
  };

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);
}

/**
 * Handles the click event for the cancel button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @returns A promise that resolves when the operation is complete.
 */
async function onCancelButtonClick({ id }: { id: string }) {
  await resolveInterface(id, false);
}

/**
 * Handles the click event for the confirm button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 * @param params.snapContext - The snap execution context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onConfirmButtonClick({
  id,
  context,
  snapContext,
}: {
  id: string;
  context: SendContext;
  snapContext: SnapExecutionContext;
}) {
  const {
    fromAccountId,
    toAddress,
    scope,
    currencySymbol,
    tokenPrices,
    amount,
    feeEstimatedInSol,
  } = context;

  // First, show the pending stage
  const contextPending: SendContext = {
    ...context,
    stage: 'send-pending',
  };

  await updateInterface(id, <Send context={contextPending} />, contextPending);

  // Then submit the transaction
  let signature: string | null = null;
  const tokenPrice = tokenPrices[Caip19Id.SolMainnet];
  const { price } = tokenPrice ?? { price: 0 };

  const amountInSol = Number(
    currencySymbol === SendCurrency.SOL
      ? amount
      : BigNumber(amount).dividedBy(BigNumber(price)).toString(),
  );

  try {
    const account = await keyring.getAccountOrThrow(fromAccountId);

    const transactionMessage = await transferSolHelper.buildTransactionMessage(
      address(account.address),
      address(toAddress),
      amountInSol,
      scope,
    );

    // We can get the fee from the transaction message this way:
    const feeInLamports = await transactionHelper.getFeeForMessageInLamports(
      transactionMessage,
      scope,
    );
    logger.log('Transaction fee in lamports', feeInLamports);

    // Encode the transaction message to a JSON serializable format in order to send it over RPC.
    const base64EncodedTransactionMessage =
      await transactionHelper.base64EncodeTransactionMessage(
        transactionMessage,
      );

    // Send the transaction message to the keyring over RPC.
    // It will be decoded on the other side, then signed and sent to the network.
    // It MUST be signed on the other side, because the transaction message is stripped of its private keys during encoding, for security reasons.
    // Fees can also be calculated on the other side from the decoded transaction message.
    const response = await keyring.handleSendAndConfirmTransaction({
      id,
      scope: context.scope,
      account: context.fromAccountId, // Will be used to sign the transaction
      request: {
        method: SolMethod.SendAndConfirmTransaction,
        params: {
          base64EncodedTransactionMessage,
        },
      },
    });
    signature = response.signature;
  } catch (error) {
    logger.error({ error }, 'Error submitting request');
  }

  const updatedContext: SendContext = {
    ...context,
    stage: signature ? 'transaction-success' : 'transaction-failure',
    feePaidInSol: feeEstimatedInSol,
    transaction: {
      result: signature ? 'success' : 'failure',
      signature,
      tokenPrice: tokenPrice ?? null,
    },
  };

  // Finally, show the transaction-complete or transaction-failed stage
  await updateInterface(id, <Send context={updatedContext} />, updatedContext);
}

export const eventHandlers = {
  [TransactionConfirmationNames.BackButton]: onBackButtonClick,
  [TransactionConfirmationNames.CancelButton]: onCancelButtonClick,
  [TransactionConfirmationNames.ConfirmButton]: onConfirmButtonClick,
};
