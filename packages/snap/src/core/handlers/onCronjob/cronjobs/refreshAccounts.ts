import { type OnCronjobHandler } from '@metamask/snaps-sdk';
import { parseCaipAssetType } from '@metamask/utils';
import type { Address } from '@solana/kit';
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

    // Get all accounts from the keyring
    const accounts = await keyring.listAccounts();

    // We only check mainnet for now
    const scope = Network.Mainnet;

    // For each account, check if there have been any changes since last check
    const accountsWithChangeCheckPromises = accounts.map(async (account) => {
      // Get previously stored transaction signatures for this account
      const localSignatures =
        (await state.getKey<Signature[]>(`signatures.${account.address}`)) ??
        [];

      // Get the most recent transaction signature for the main account
      const [latestMainSignatures] =
        await transactionsService.fetchLatestSignatures(
          scope,
          address(account.address),
          1,
        );

      // TODO: We may need to discover tokens here for accounts that have never held tokens

      // Get all token assets associated with this account
      const assets = await assetsService.listAccountAssets(account);

      // For each token asset, get its associated token account
      const associatedTokenAccounts = await Promise.all(
        assets.map(async (assetType) =>
          assetsService.getTokenAccountsByOwner(
            address(account.address),
            parseCaipAssetType(assetType).assetReference as Address,
            scope,
          ),
        ),
      );

      // Get the most recent transaction signature for each token account
      const latestAssociatedTokenSignatures = await Promise.all<Signature[]>(
        associatedTokenAccounts.map(async (tokenAccount) =>
          transactionsService.fetchLatestSignatures(scope, tokenAccount, 1),
        ),
      );

      // Combine signatures from main account and all token accounts
      const allLatestSignatures = [
        latestMainSignatures,
        ...latestAssociatedTokenSignatures,
      ].filter(Boolean);

      // Log the latest signatures found
      logger.log(
        `[refreshAccounts] Latest signature for account ${account.address} is ${allLatestSignatures}`,
      );

      // Return the account along with whether it has had any changes
      // Changes are detected by comparing new signatures against stored ones
      return {
        account,
        didChange:
          !allLatestSignatures ||
          localSignatures.every(
            (signature) => !allLatestSignatures.includes(signature),
          ),
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
