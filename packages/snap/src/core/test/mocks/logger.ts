import type { ILogger } from '../../utils/logger';

export const mockLogger: ILogger = {
  log: jest.fn().mockImplementation(console.log),
  error: jest.fn().mockImplementation(console.error),
  info: jest.fn().mockImplementation(console.info),
  warn: jest.fn().mockImplementation(console.warn),
  debug: jest.fn().mockImplementation(console.debug),
};
