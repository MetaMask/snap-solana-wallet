import { type Transaction } from '@metamask/keyring-api';

import { connection } from '../../../../snapContext';
import { type Network } from '../../../constants/solana';
import { fromUnknowBase64StringToTransactionOrTransactionMessage } from '../../../sdk-extensions/codecs';

/**
 * Maps a base64 encoded transaction string (before execution) to a standardized Transaction format.
 *
 * Note: This provides less information than `mapRpcTransaction` as it lacks execution metadata.
 * - Status will be 'Signed'.
 * - Timestamp is approximated using Date.now().
 * - Fees are estimated based on signatures, not actual cost.
 * - SPL Token transfers are NOT currently parsed due to missing mint information.
 *
 * @param params - The options object.
 * @param params.base64EncodedTransaction - The base64 string of the serialized transaction.
 * @param params.scope - The network scope (e.g., 'solana:mainnet', 'solana:devnet').
 * @param params.address - The user's account address associated with the transaction.
 * @returns The mapped transaction data, or null if decoding/parsing fails.
 */
export async function mapBase64EncodedTransaction({
  scope,
  address,
  base64EncodedTransaction,
}: {
  scope: Network;
  address: string;
  base64EncodedTransaction: string;
}): Promise<Transaction | null> {
  try {
    const rpc = connection.getRpc(scope);

    const transactionMessageOrTransaction =
      await fromUnknowBase64StringToTransactionOrTransactionMessage(
        base64EncodedTransaction,
        rpc,
      );

    // TODO: turn instructions into native SOL transfers and SPL token transfers

    return null;
  } catch (error) {
    console.error('Failed to map base64 encoded transaction:', error);
    return null; // Return null on error
  }
}
