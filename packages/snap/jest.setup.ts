import { jest } from '@jest/globals';

import logger from './src/core/utils/logger';

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
