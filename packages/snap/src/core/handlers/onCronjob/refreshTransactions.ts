import type { Transaction } from '@metamask/keyring-api';
import type { Address, Signature } from '@solana/web3.js';
import { address as asAddress } from '@solana/web3.js';

import { keyring, state, transactionsService } from '../../../snap-context';
import { Network } from '../../constants/solana';
import logger from '../../utils/logger';

/**
 * Fetch latest transactions for all accounts on all networks.
 */
export async function refreshTransactions() {
  try {
    logger.info('[refreshTransactions] Cronjob triggered');

    const currentState = await state.get();

    if (currentState.isFetchingTransactions) {
      logger.info(
        '[refreshTransactions] Transactions already being fetched. Skipping.',
      );
      return;
    }

    const accounts = await keyring.listAccounts();

    if (accounts.length === 0) {
      logger.info('[refreshTransactions] No accounts found');
      return;
    }

    logger.log(
      `[refreshTransactions] Found ${accounts.length} accounts in keyring`,
    );

    await state.set({
      ...currentState,
      isFetchingTransactions: true,
    });

    const scopes = [Network.Mainnet, Network.Devnet];

    // Create a set to store existing signatures for quick lookup
    const existingSignatures = new Set<string>();
    Object.values(currentState.transactions || {}).forEach(
      (txs: Transaction[]) => {
        txs.forEach((tx) => existingSignatures.add(tx.id));
      },
    );

    // Create a map to store new signatures by scope
    const newSignaturesByScope = new Map<string, string[]>();
    scopes.forEach((scope) => newSignaturesByScope.set(scope, []));

    // Fetch all new signatures first, organizing them by scope
    for (const account of accounts) {
      for (const scope of scopes) {
        logger.log(
          `[refreshTransactions] Fetching all signatures for ${account.address} on ${scope}...`,
        );

        const signatures = await transactionsService.fetchLatestSignatures(
          scope,
          asAddress(account.address),
          2,
        );

        // Filter out signatures we already have
        const filteredSignatures = signatures.filter(
          (signature) => !existingSignatures.has(signature),
        );

        newSignaturesByScope.get(scope)?.push(...filteredSignatures);

        logger.log(
          `[refreshTransactions] Found ${filteredSignatures.length} new signatures out of ${signatures.length} total for address ${account.address} on network ${scope}`,
        );
      }
    }

    // Fetch transaction data for new signatures, scope by scope
    const transactions = { ...currentState.transactions };

    for (const account of accounts) {
      if (!transactions[account.id]) {
        transactions[account.id] = [];
      }

      for (const scope of scopes) {
        const scopedSignatures = newSignaturesByScope.get(scope) ?? [];
        if (scopedSignatures.length === 0) {
          continue;
        }

        const transactionsData =
          await transactionsService.getTransactionsDataFromSignatures({
            scope,
            signatures: scopedSignatures as Signature[],
          });

        const newTransactions = transactionsData
          .map((txData) => {
            const mappedTx = transactionsService.mapRpcTransaction({
              scope,
              address: account.address as Address,
              transactionData: txData,
            });

            if (mappedTx) {
              return {
                ...mappedTx,
                account: account.address,
              };
            }
            return null;
          })
          .filter((tx): tx is Transaction => tx !== null);

        transactions[account.id] = [
          ...(transactions[account.id] ?? []),
          ...newTransactions,
        ];
      }
    }

    /**
     * All done. Free the lock and save the new state.
     */
    const newState = await state.get();
    await state.set({
      ...newState,
      isFetchingTransactions: false,
      transactions,
    });

    logger.info('[refreshTransactions] Cronjob finished');
  } catch (error) {
    logger.error('[refreshTransactions] Cronjob failed');

    // Make sure to release the lock even if there's an error
    const currentState = await state.get();
    await state.set({
      ...currentState,
      isFetchingTransactions: false,
    });
  }
}
