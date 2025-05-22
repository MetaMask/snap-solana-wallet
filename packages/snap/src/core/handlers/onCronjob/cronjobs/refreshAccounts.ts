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

const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds
const RANDOM_SLEEP = Math.floor(Math.random() * REFRESH_INTERVAL);

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

    // Go to sleep for a random amount of time to spread load
    await new Promise((resolve) => setTimeout(resolve, RANDOM_SLEEP));
    logger.info(`[refreshAccounts] Slept for ${RANDOM_SLEEP}ms to spread load`);

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
