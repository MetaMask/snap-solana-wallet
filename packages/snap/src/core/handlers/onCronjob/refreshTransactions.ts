import { KeyringEvent, type Transaction } from '@metamask/keyring-api';
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
function mapExistingSignaturesSet(
  transactions: Record<string, Transaction[]>,
): Set<string> {
  return new Set(
    Object.values(transactions ?? {})
      .flat()
      .map((tx) => tx.id),
  );
}

/**
 * Fetches and collects new transaction signatures for all accounts across networks.
 * @param params - Parameters for fetching signatures.
 * @param params.accounts - List of accounts to fetch signatures for.
 * @param params.scopes - List of networks to check.
 * @param params.existingSignatures - Set of already known signatures.
 * @returns Mapping of new signatures by network and account.
 */
async function collectNewTransactionSignatures({
  scopes = [Network.Mainnet, Network.Devnet],
  accounts,
  existingSignatures,
}: {
  scopes?: Network[];
  accounts: { id: string; address: string }[];
  existingSignatures: Set<string>;
}): Promise<SignatureMapping> {
  const newSignaturesMapping: SignatureMapping = {
    byNetwork: new Map(scopes.map((scope) => [scope, new Set<string>()])),
    byAccountAndNetwork: new Map(
      accounts.map((account) => [
        account.id,
        new Map(scopes.map((scope) => [scope, new Set<string>()])),
      ]),
    ),
  };

  /**
   * For each account and network, fetch the latest signatures and take note of the
   * ones we need to fetch data for.
   */
  for (const account of accounts) {
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

      const networkSet = newSignaturesMapping.byNetwork.get(
        scope,
      ) as Set<string>;
      const accountMap = newSignaturesMapping.byAccountAndNetwork.get(
        account.id,
      ) as Map<Network, Set<string>>;
      const accountNetworkSet = accountMap.get(scope) as Set<string>;

      newSignatures.forEach((signature) => {
        networkSet.add(signature);
        accountNetworkSet.add(signature);
      });

      logger.info(
        `[refreshTransactions] Found ${newSignatures.length} new signatures (${signatures.length} total) for ${account.address} on ${scope}`,
      );
    }
  }

  return newSignaturesMapping;
}

/**
 * Fetches and maps transactions for all accounts on a per-network basis.
 * @param params - Parameters for fetching and mapping transactions.
 * @param params.scopes - List of networks to process.
 * @param params.accounts - List of accounts to process.
 * @param params.newSignaturesMapping - Mapping of signatures by network and account.
 * @returns Updated transactions record.
 */
async function fetchAndMapTransactionsPerAccount({
  scopes = [Network.Mainnet, Network.Devnet],
  accounts,
  newSignaturesMapping,
}: {
  scopes?: Network[];
  accounts: { id: string; address: string }[];
  newSignaturesMapping: SignatureMapping;
}): Promise<Record<string, Transaction[]>> {
  const newTransactions: Record<string, Transaction[]> = {};

  for (const scope of scopes) {
    const networkSet = newSignaturesMapping.byNetwork.get(scope) as Set<string>;

    if (!networkSet.size) {
      continue;
    }

    const networkSignatures = Array.from(networkSet);

    const transactionsData =
      await transactionsService.getTransactionsDataFromSignatures({
        scope,
        signatures: networkSignatures as Signature[],
      });

    // Map fetched transactions to their respective accounts
    for (const account of accounts) {
      if (!newTransactions[account.id]) {
        newTransactions[account.id] = [];
      }

      const accountMap = newSignaturesMapping.byAccountAndNetwork.get(
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

      newTransactions[account.id]?.push(...accountTransactions);
    }
  }

  return newTransactions;
}

/**
 * Fetch latest transactions for all accounts on all networks.
 */
export async function refreshTransactions() {
  try {
    logger.info('[refreshTransactions] Cronjob triggered');

    const currentState = await state.get();
    if (currentState.isFetchingTransactions) {
      logger.info('[refreshTransactions] Another instance is already running');
      return;
    }

    const accounts = await keyring.listAccounts();
    if (!accounts.length) {
      logger.info('[refreshTransactions] No accounts found');
      return;
    }

    await state.update((oldState) => ({
      ...oldState,
      isFetchingTransactions: true,
    }));

    const transactionsByAccount = currentState.transactions;
    const existingSignatures = mapExistingSignaturesSet(transactionsByAccount);

    const newSignaturesMapping = await collectNewTransactionSignatures({
      accounts,
      existingSignatures,
    });

    const newTransactionsByAccount = await fetchAndMapTransactionsPerAccount({
      accounts,
      newSignaturesMapping,
    });

    const updatedTransactions = Object.fromEntries(
      accounts.map((account) => [
        account.id,
        [
          ...(transactionsByAccount[account.id] ?? []),
          ...(newTransactionsByAccount[account.id] ?? []),
        ],
      ]),
    );

    await keyring.emitEvent(KeyringEvent.AccountTransactionsUpdated, {
      transactions: newTransactionsByAccount,
    });

    await state.update((oldState) => ({
      ...oldState,
      isFetchingTransactions: false,
      transactions: updatedTransactions,
    }));

    logger.info('[refreshTransactions] Cronjob finished');
  } catch (error) {
    logger.error('[refreshTransactions] Error. Releasing lock...');
    logger.error(JSON.stringify(error));

    await state.update((oldState) => ({
      ...oldState,
      isFetchingTransactions: false,
    }));

    logger.info('[refreshTransactions] Cronjob finished');
  }
}
