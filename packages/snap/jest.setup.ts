import { jest } from '@jest/globals';
import BigNumber from 'bignumber.js';
import dotenv from 'dotenv';

import logger from './src/core/utils/logger';

dotenv.config();

// Lowest precision we ever go for: MicroLamports represented in Sol amount
BigNumber.config({ EXPONENTIAL_AT: 16 });

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
