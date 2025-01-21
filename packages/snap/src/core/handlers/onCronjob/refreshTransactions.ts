import type { Transaction } from '@metamask/keyring-api';
import type { Address, Signature } from '@solana/web3.js';
import { address as asAddress } from '@solana/web3.js';

import {
  configProvider,
  keyring,
  state,
  transactionsService,
} from '../../../snapContext';
import { Network } from '../../constants/solana';
import { mapRpcTransaction } from '../../services/transactions/utils/mapRpcTransaction';
import logger from '../../utils/logger';

type SignatureMapping = {
  // For bulk fetching: All signatures for a network
  byNetwork: Map<Network, Set<string>>;
  // For account mapping: Signatures for each account+network combination
  byAccountAndNetwork: Map<string, Map<Network, Set<string>>>;
};

/**
 * Creates a Set of existing transaction signatures for quick lookup.
 * @param transactions - The current state's transactions record, mapping account IDs to their transactions.
 * @returns A Set containing all existing transaction signatures.
 */
function createExistingSignaturesSet(
  transactions: Record<string, Transaction[]>,
): Set<string> {
  const existingSignatures = new Set<string>();
  Object.values(transactions || {}).forEach((txs: Transaction[]) => {
    txs.forEach((tx) => existingSignatures.add(tx.id));
  });
  return existingSignatures;
}

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

    await state.update((oldState) => {
      return {
        ...oldState,
        isFetchingTransactions: true,
      };
    });

    const scopes = [Network.Mainnet, Network.Devnet];

    const existingSignatures = createExistingSignaturesSet(
      currentState.transactions,
    );
    const signatureMapping: SignatureMapping = {
      /**
       * This mapping is useful for requests, since we can fetch all of the same scope together.
       */
      byNetwork: new Map(scopes.map((scope) => [scope, new Set<string>()])),
      /**
       * This mapping is useful for the account mapping, since we need to know which
       * signatures are associated with which account.
       */
      byAccountAndNetwork: new Map(),
    };

    /**
     * For each account and network, fetch the latest signatures and take note of the
     * ones we need to fetch data for.
     */
    for (const account of accounts) {
      signatureMapping.byAccountAndNetwork.set(
        account.id,
        new Map(scopes.map((scope) => [scope, new Set<string>()])),
      );

      for (const scope of scopes) {
        logger.log(
          `[refreshTransactions] Fetching signatures for ${account.address} on ${scope}...`,
        );

        const signatures = await transactionsService.fetchLatestSignatures(
          scope,
          asAddress(account.address),
          configProvider.get().transactions.storageLimit,
        );

        /**
         * Filter out existing signatures and store new ones
         */
        const newSignatures = signatures.filter(
          (signature) => !existingSignatures.has(signature),
        );

        if (!newSignatures.length) {
          logger.log(
            `[refreshTransactions] Found 0 new signatures out of ${signatures.length} total for address ${account.address} on network ${scope}`,
          );
          continue;
        }

        /**
         * Add to network-scoped collection
         */
        const networkSet = signatureMapping.byNetwork.get(scope) as Set<string>;
        newSignatures.forEach((signature) => networkSet.add(signature));

        /**
         * Add to account+network collection
         */
        const accountMap = signatureMapping.byAccountAndNetwork.get(
          account.id,
        ) as Map<Network, Set<string>>;
        const accountNetworkSet = accountMap.get(scope) as Set<string>;
        newSignatures.forEach((signature) => accountNetworkSet.add(signature));

        logger.log(
          `[refreshTransactions] Found ${newSignatures.length} new signatures out of ${signatures.length} total for address ${account.address} on network ${scope}`,
        );
      }
    }

    // Fetch transaction data for new signatures, network by network
    const { transactions } = currentState;

    // Initialize transaction arrays for all accounts
    accounts.forEach((account) => {
      if (!transactions[account.id]) {
        transactions[account.id] = [];
      }
    });

    /**
     * Fetch and map transactions for each network. Notice how we can be
     * account agnostic here, since we have a map of signatures by account.
     */
    for (const scope of scopes) {
      const networkSet = signatureMapping.byNetwork.get(scope) as Set<string>;

      if (!networkSet.size) {
        continue;
      }

      const networkSignatures = Array.from(networkSet);

      const transactionsData =
        await transactionsService.getTransactionsDataFromSignatures({
          scope,
          signatures: networkSignatures as Signature[],
        });

      /**
       * Map fetched transactions to their respective accounts
       */
      for (const account of accounts) {
        const accountMap = signatureMapping.byAccountAndNetwork.get(
          account.id,
        ) as Map<Network, Set<string>>;
        const accountNetworkSet = accountMap.get(scope) as Set<string>;

        const accountTransactions = transactionsData
          .filter((txData) => {
            const signature = txData?.transaction?.signatures[0];
            return signature && accountNetworkSet.has(signature);
          })
          .map((txData) => {
            const mappedTx = mapRpcTransaction({
              scope,
              address: account.address as Address,
              transactionData: txData,
            });

            if (!mappedTx) {
              return null;
            }

            return {
              ...mappedTx,
              account: account.address,
            };
          })
          .filter((tx): tx is Transaction => tx !== null)
          .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

        transactions[account.id] = [
          ...(transactions[account.id] ?? []),
          ...accountTransactions,
        ];
      }
    }

    /**
     * Save the new state and release the lock
     */
    await state.update((oldState) => {
      return {
        ...oldState,
        isFetchingTransactions: false,
        transactions,
      };
    });

    logger.info('[refreshTransactions] Cronjob finished');
  } catch (error) {
    logger.error('[refreshTransactions] Cronjob failed');

    /**
     * Pray that the error did not come from the state. Otherwise it's a panic.
     */
    await state.update((oldState) => {
      return {
        ...oldState,
        isFetchingTransactions: false,
      };
    });
  }
}
