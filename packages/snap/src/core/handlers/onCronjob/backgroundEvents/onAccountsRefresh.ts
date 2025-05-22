import { type OnCronjobHandler } from '@metamask/snaps-sdk';
import type { Signature } from '@solana/kit';
import { address } from '@solana/kit';

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
export const onAccountsRefresh: OnCronjobHandler = async () => {
  try {
    logger.info('[onAccountsRefresh] Cronjob triggered');

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
        `[onAccountsRefresh] Latest signature for account ${account.address} is ${latestSignature}`,
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
        '[onAccountsRefresh] No accounts with changes, skipping refresh',
      );
      return;
    }

    logger.info(
      `[onAccountsRefresh] Found ${accountsWithChanges.length} accounts with changes`,
    );

    /**
     * The two following calls cannot run in parallel, because
     * if they did, they would hit rate limits on the Token API
     */

    await assetsService.refreshAssets(accounts).catch((error) => {
      logger.warn(
        '[onAccountsRefresh] Caught error while refreshing assets',
        error,
      );
    });

    await transactionsService
      .refreshTransactions(accountsWithChanges)
      .catch((error) => {
        logger.warn(
          '[onAccountsRefresh] Caught error while refreshing transactions',
          error,
        );
      });

    logger.info(
      `[onAccountsRefresh] Successfully refreshed ${accountsWithChanges.length} accounts`,
    );
  } catch (error) {
    logger.error('[onAccountsRefresh] Error', error);
  }
};
