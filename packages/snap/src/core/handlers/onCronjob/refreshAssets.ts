import { KeyringEvent, type Balance } from '@metamask/keyring-api';

import { keyring, state } from '../../../snapContext';
import { diffArrays } from '../../utils/diffArrays';
import { diffObjects } from '../../utils/diffObjects';
import logger from '../../utils/logger';

/**
 * Refreshes assets for all accounts in the keyring.
 * Fetches current balances and emits events for any changes.
 */
export async function refreshAssets() {
  logger.info('[refreshAssets] Cronjob triggered');

  try {
    const currentState = await state.get();

    if (currentState.isFetchingAssets) {
      logger.info('[refreshAssets] Assets already being fetched. Skipping.');
      return;
    }

    const accounts = await keyring.listAccounts();

    if (accounts.length === 0) {
      logger.info('[refreshAssets] No accounts found');
      return;
    }

    logger.log(`[refreshAssets] Found ${accounts.length} accounts in keyring`);

    await state.set({
      ...currentState,
      isFetchingAssets: true,
    });

    const accountToAssetsMap = new Map<string, Record<string, Balance>>();

    for (const account of accounts) {
      logger.log(
        `[refreshAssets] Fetching all assets for ${account.address} in all networks`,
      );

      const accountAssets = await keyring.listAccountAssets(account.id);

      const previousAssets = currentState.assets[account.id];
      const previousCaip19Assets = Object.keys(previousAssets ?? {});
      const currentCaip19Assets = accountAssets ?? {};

      // check if account assets have change
      const {
        added: assetsAdded,
        deleted: assetsDeleted,
        hasDiff: assetsChanged,
      } = diffArrays(previousCaip19Assets, currentCaip19Assets);

      if (assetsChanged) {
        logger.info(
          { assetsAdded, assetsDeleted, assetsChanged },
          `[refreshAssets] Found updated assets for ${account.address}`,
        );

        await keyring.emitEvent(KeyringEvent.AccountAssetListUpdated, {
          assets: {
            [account.id]: {
              added: assetsAdded,
              removed: assetsDeleted,
            },
          },
        });
      }

      const accountBalances = await keyring.getAccountBalances(
        account.id,
        accountAssets,
      );

      const previousBalances = currentState.assets[account.id];

      // check if balances have changed
      const {
        added: balancesAdded,
        deleted: balancesDeleted,
        changed: balancesChanged,
        hasDiff: balancesHaveChange,
      } = diffObjects(previousBalances ?? {}, accountBalances);

      if (balancesHaveChange) {
        logger.info(
          { balancesAdded, balancesDeleted, balancesChanged },
          `[refreshAssets] Found updated balances for ${account.address}`,
        );

        await keyring.emitEvent(KeyringEvent.AccountBalancesUpdated, {
          balances: {
            [account.id]: {
              ...balancesAdded,
              ...balancesChanged,
            },
          },
        });
      }

      accountToAssetsMap.set(account.id, accountBalances);
    }

    await state.set({
      ...currentState,
      assets: Object.fromEntries(accountToAssetsMap),
      isFetchingAssets: false,
    });

    logger.info('[refreshAssets] Done refreshing assets');
  } catch (error) {
    await state.update((oldState) => {
      return {
        ...oldState,
        isFetchingAssets: false,
      };
    });

    logger.error({ error }, '[refreshAssets] Error refreshing assets');
  }
}
