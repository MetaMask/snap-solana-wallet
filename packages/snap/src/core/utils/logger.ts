/**
 * A simple logger utility that provides methods for logging messages at different levels.
 * For now, it's just a wrapper around console.
 *
 * @namespace logger
 */

import { logMaybeSolanaError } from './logMaybeSolanaError';

export type ILogger = {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
};

const withSolanaErrorLogging =
  (logFn: (...args: any[]) => void) =>
  (...args: any[]) => {
    logMaybeSolanaError(args[0]);
    logFn(...args);
  };

/**
 * A basic logger that wraps the console, extending its functionality to properly log Solana errors.
 */
const logger: ILogger = {
  ...console,
  error: withSolanaErrorLogging(console.error),
};

export default logger;
