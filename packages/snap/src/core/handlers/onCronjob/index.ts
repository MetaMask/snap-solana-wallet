import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { handlers as backgroundEventHandlers } from './backgroundEvents';
import type { ScheduleBackgroundEventMethod } from './backgroundEvents/ScheduleBackgroundEventMethod';
import { handlers as cronjobHandlers } from './cronjobs';
import type { CronjobMethod } from './cronjobs/CronjobMethod';

export const handlers: Record<
  CronjobMethod | ScheduleBackgroundEventMethod,
  OnCronjobHandler
> = {
  ...cronjobHandlers,
  ...backgroundEventHandlers,
};
