import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { state } from '../../../../snapContext';
import logger from '../../../utils/logger';
import { ScheduleBackgroundEventMethod } from '../backgroundEvents/ScheduleBackgroundEventMethod';

const REFRESH_INTERVAL_MINUTES = 2;

/**
 * Schedules a refresh of accounts at random intervals.
 *
 * This is used to smooth out the load of the cronjob, avoiding multiple cronjobs to run at the same time.
 * Otherwise, all client all over the world would trigger RPC requests at the very same time, causing
 * spike traffic on the RPC nodes.
 */
export const scheduleRefreshAccounts: OnCronjobHandler = async () => {
  logger.info('[scheduleRefreshAccounts] Cronjob triggered');

  // Get a random sleep time when this method is called

  let refreshAccountsInterval = await state.getKey<number>(
    'refreshAccountsInterval',
  );

  if (!refreshAccountsInterval) {
    refreshAccountsInterval =
      (Math.random() || Number.MIN_VALUE) * REFRESH_INTERVAL_MINUTES;
    await state.setKey('refreshAccountsInterval', refreshAccountsInterval);
  }

  await snap.request({
    method: 'snap_scheduleBackgroundEvent',
    params: {
      duration: `PT${refreshAccountsInterval}M`,
      request: {
        method: ScheduleBackgroundEventMethod.OnAccountsRefresh,
        params: {},
      },
    },
  });

  logger.info(
    `[scheduleRefreshAccounts] Scheduling next refresh in ${refreshAccountsInterval} minutes`,
  );
};
