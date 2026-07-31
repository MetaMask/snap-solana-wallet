import type { SimulationUserOptions } from '@metamask/snaps-simulation';
import { jest } from '@jest/globals';
import BigNumber from 'bignumber.js';
import dotenv from 'dotenv';

import { registerCoreAssetsControllerHandlers } from './src/core/test/helpers/registerCoreAssetsControllerHandlers';
import logger from './src/core/utils/logger';

dotenv.config();

// Lowest precision we ever go for: MicroLamports represented in Sol amount
BigNumber.config({ EXPONENTIAL_AT: 16 });

type SnapsTestEnvironment = {
  installSnap: (
    snapId?: string,
    options?: { options?: SimulationUserOptions },
  ) => Promise<{
    controllerMessenger: Parameters<
      typeof registerCoreAssetsControllerHandlers
    >[0];
  }>;
};

const snapsEnvironment = (globalThis as { snapsEnvironment?: SnapsTestEnvironment })
  .snapsEnvironment;

if (snapsEnvironment) {
  const originalInstallSnap = snapsEnvironment.installSnap.bind(snapsEnvironment);
  jest
    .spyOn(snapsEnvironment, 'installSnap')
    .mockImplementation(async (snapId, options = {}) => {
      const installed = await originalInstallSnap(snapId, options);
      registerCoreAssetsControllerHandlers(
        installed.controllerMessenger,
        options.options ?? {},
      );
      return installed;
    });
}

// Mock the console methods
jest.spyOn(logger, 'log').mockImplementation(() => {
  /* no-op */
});
jest.spyOn(logger, 'info').mockImplementation(() => {
  /* no-op */
});
jest.spyOn(logger, 'warn').mockImplementation(() => {
  /* no-op */
});
jest.spyOn(logger, 'error').mockImplementation(() => {
  /* no-op */
});
