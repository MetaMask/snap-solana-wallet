import type { Transaction } from '@metamask/keyring-api';
import { type OnCronjobHandler } from '@metamask/snaps-sdk';
import { address, type Signature } from '@solana/kit';

import {
  assetsService,
  keyring,
  state,
  transactionsService,
} from '../../../../snapContext';
import { Network } from '../../../constants/solana';
import logger from '../../../utils/logger';

/**
 * Performs a "smart" refresh of accounts' transactions and assets.
 *
 * For each account, it checks if it had new signatures since last slot checked.
 * - If the account had new signatures, it refreshes its transactions and assets
 * - If not, it simply skips.
 */
export const refreshAccounts: OnCronjobHandler = async () => {
  try {
    logger.info('[refreshAccounts] Cronjob triggered');

    const accounts = await keyring.listAccounts();

    const scope = Network.Mainnet;

    const accountsWithChangeCheckPromises = accounts.map(async (account) => {
      const signatures =
        (await state.getKey<Signature[]>(`signatures.${account.address}`)) ??
        [];

      const [latestSignature] = await transactionsService.fetchLatestSignatures(
        scope,
        address(account.address),
        1,
      );

      logger.log(
        `[refreshAccounts] Latest signature for account ${account.address} is ${latestSignature}`,
      );

      console.log(JSON.stringify(signatures));

      return {
        account,
        didChange:
          !latestSignature ||
          signatures.every((signature) => signature !== latestSignature),
      };
    });

    const accountsWithChangeCheck = await Promise.all(
      accountsWithChangeCheckPromises,
    );

    console.log(
      '[refreshAccounts] accountsWithChangeCheck',
      accountsWithChangeCheck,
    );

    const accountsWithChanges = accountsWithChangeCheck
      .filter((item) => item.didChange)
      .map((item) => item.account);

    if (accountsWithChanges.length === 0) {
      logger.info(
        '[refreshAccounts] No accounts with changes, skipping refresh',
      );
      return;
    }

    logger.info(
      `[refreshAccounts] Found ${accountsWithChanges.length} accounts with changes`,
    );

    /**
     * The two following calls cannot run in parallel, because
     * if they did, they would hit rate limits on the Token API
     */

    await transactionsService
      .refreshTransactions(accountsWithChanges)
      .catch((error) => {
        logger.warn(
          '[refreshAccounts] Caught error while refreshing transactions',
          error,
        );
      });

    await assetsService.refreshAssets(accountsWithChanges).catch((error) => {
      logger.warn(
        '[refreshAccounts] Caught error while refreshing assets',
        error,
      );
    });

    logger.info(
      `[refreshAccounts] Successfully refreshed ${accountsWithChanges.length} accounts`,
    );
  } catch (error) {
    logger.error('[refreshAccounts] Error', error);
  }
};
