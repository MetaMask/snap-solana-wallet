import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { tokenRatesService } from '../../../snap-context';
import logger from '../../utils/logger';

export const refreshTokenRates: OnCronjobHandler = async () => {
  try {
    logger.info('[refreshTokenRates] Cronjob triggered');
    await tokenRatesService.refreshTokenRates();
  } catch (error) {
    logger.info({ error }, '[refreshTokenRates] Cronjob failed');
  }
};
