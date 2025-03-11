import { literal, type OnCronjobHandler } from '@metamask/snaps-sdk';
import { assert, object, optional, string } from '@metamask/superstruct';

import { assetsService, keyring } from '../../../../snapContext';
import logger from '../../../utils/logger';
import { UuidStruct } from '../../../validation/structs';

export const RefreshAssetsRequestStruct = object({
  id: string(),
  jsonrpc: literal('2.0'),
  method: literal('refreshAssets'),
  params: object({
    accountId: optional(UuidStruct),
  }),
});

/**
 * Refreshes balances for passed accountId or all accounts in the keyring and emits events for any changes.
 *
 * @param args - The arguments object.
 * @param args.request - The request object containing transaction details.
 */
export const refreshAssets: OnCronjobHandler = async ({ request }) => {
  try {
    logger.info('[refreshAssets] Cronjob triggered');

    assert(request, RefreshAssetsRequestStruct);

    const { accountId } = request.params;

    // If we receive a specific accountId, we only refresh the assets for that account, otherwise we refresh all accounts.
    const accounts = accountId
      ? [await keyring.getAccountOrThrow(accountId)]
      : await keyring.listAccounts();

    await assetsService.refreshAssets(accounts);

    logger.info('[refreshAssets] Done refreshing assets');
  } catch (error) {
    logger.error({ error }, '[refreshAssets] Error refreshing assets');
  }
};
