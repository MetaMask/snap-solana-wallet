import { type OnCronjobHandler } from '@metamask/snaps-sdk';
import type { Signature } from '@solana/kit';
import { address } from '@solana/kit';

import {
  assetsService,
  keyring,
  state,
  transactionsService,
  webSocketService,
} from '../../../../snapContext';
import { Network } from '../../../constants/solana';
import logger from '../../../utils/logger';

/**
 * Performs a "smart" refresh of accounts' transactions and assets.
 *
 * For each account, it checks if it had new signatures since last slot checked.
 * - If the account had new signatures, it refreshes its transactions and assets
 * - If not, it simply skips.
 *
 * Note: This handler now also initializes WebSocket subscriptions to gradually
 * replace HTTP polling with real-time WebSocket updates.
 */
export const onAccountsRefresh: OnCronjobHandler = async () => {
  try {
    logger.info('[onAccountsRefresh] Cronjob triggered');

    const accounts = await keyring.listAccounts();
    const scope = Network.Mainnet;

    // Initialize WebSocket subscriptions if not already active
    const activeSubscriptions = webSocketService.getActiveSubscriptions();
    if (activeSubscriptions.length === 0 && accounts.length > 0) {
      logger.info('[onAccountsRefresh] Initializing WebSocket subscriptions');
      try {
        await webSocketService.initialize(accounts, scope);
        logger.info(
          '[onAccountsRefresh] WebSocket subscriptions initialized successfully',
        );

        // If WebSocket initialization is successful, we can reduce the frequency
        // of this cronjob or eventually phase it out completely
        await state.setKey('webSocketInitialized', true);
      } catch (error) {
        logger.warn(
          '[onAccountsRefresh] Failed to initialize WebSocket, falling back to HTTP polling:',
          error,
        );
      }
    }

    // Continue with existing HTTP polling logic as fallback
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
        // If we found the latest signature and it's not in the list of signatures, then we consider it as a change
        didChange: latestSignature && !signatures.includes(latestSignature),
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

    await assetsService.refreshAssets(accountsWithChanges).catch((error) => {
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
