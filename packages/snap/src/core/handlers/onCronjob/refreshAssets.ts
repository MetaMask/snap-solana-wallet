import type { Balance } from '@metamask/keyring-api';
import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { keyring, state } from '../../../snapContext';
import { diffArrays } from '../../utils/diffArrays';
import { diffObjects } from '../../utils/diffObjects';
import logger from '../../utils/logger';

export const refreshAssets: OnCronjobHandler = async () => {
  logger.info('[refreshAssets] Cronjob triggered');

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
    const currentCaip19Assets = Object.keys(
      currentState.assets[account.id] ?? {},
    );

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
      // TODO: notify the extension of new assets
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
      hasDiff: balancesChanged,
    } = diffObjects(previousBalances ?? {}, accountBalances);

    if (balancesChanged) {
      logger.info(
        { balancesAdded, balancesDeleted, balancesChanged },
        `[refreshAssets] Found updated balances for ${account.address}`,
      );
      // TODO: notify the extension of new assets
    }

    accountToAssetsMap.set(account.id, accountBalances);
  }

  await state.set({
    ...currentState,
    assets: Object.fromEntries(accountToAssetsMap),
    isFetchingAssets: false,
  });

  logger.info('[refreshAssets] Done refreshing assets');
};
