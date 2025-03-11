import { InternalError } from '@metamask/snaps-sdk';

import { keyring, transactionsService } from '../../../../snapContext';
import logger from '../../../utils/logger';

/**
 * Fetch latest transactions for all accounts on all networks.
 */
export async function refreshTransactions() {
  try {
    logger.info('[refreshTransactions] Cronjob triggered');

    const accounts = await keyring.listAccounts();

    await transactionsService.refreshTransactions(accounts);

    logger.info('[refreshTransactions] Cronjob finished');
  } catch (error) {
    logger.error('[refreshTransactions] Error', error);
    throw new InternalError(error as string) as Error;
  }
}
