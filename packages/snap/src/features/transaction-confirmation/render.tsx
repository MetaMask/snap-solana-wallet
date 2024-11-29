import { SolanaState } from '../../core/services/state';
import { createInterface, showDialog } from '../../core/utils/interface';
import { TransactionResultDialog } from '../send/views/TransactionResultDialog/TransactionResultDialog';
import { TransactionConfirmation } from './components/TransactionConfirmation/TransactionConfirmation';
import {
  type TransactionConfirmationContext,
  type TransactionConfirmationParams,
} from './components/TransactionConfirmation/types';

/**
 * Renders the transaction confirmation component.
 *
 * @param params - The parameters for the transaction confirmation.
 * @returns The ID of the created dialog.
 */
export async function renderTransactionConfirmation(
  params: TransactionConfirmationParams,
) {
  const state = new SolanaState();
  const currentState = await state.get();
  const keyringAccountsMap = currentState?.keyringAccounts ?? {};

  /**
   * Turn the Account ID source into an Address
   */
  const fromAccount = keyringAccountsMap[params.fromAccountId];

  if (!fromAccount) {
    throw new Error(`Account with ID ${params.fromAccountId} not found`);
  }

  const fromAddress = fromAccount.address;

  const context: TransactionConfirmationContext = {
    scope: params.scope,

    fromAccountId: params.fromAccountId,
    fromAddress,
    toAddress: params.toAddress,

    amount: params.amount,
    fee: params.fee,

    tokenSymbol: params.tokenSymbol,
    tokenContractAddress: params.tokenContractAddress,
    tokenPrice: params.tokenPrice,
  };

  const id = await createInterface(
    <TransactionResultDialog signature={'5Y64J6gUNd67hM63Aeks3qVLGWRM3A52PFFjqKSPTVDdAZFbaPDHHLTFCs3ioeFcAAXFmqcUftZeLJVZCzqovAJ4'} />,
    // <TransactionConfirmation context={context} />,
    context,
  );

  return showDialog(id);
}
