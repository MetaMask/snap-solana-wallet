import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import type { CronjobMethod } from './CronjobMethod';

export const handlers: Record<CronjobMethod, OnCronjobHandler> = {};
