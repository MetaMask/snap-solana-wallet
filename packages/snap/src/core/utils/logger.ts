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

// eslint-disable-next-line no-restricted-globals
const isLocal = Boolean(process.env.LOCAL);

/**
 * A decorator function that noops if the environment is not local,
 * and runs the decorated function otherwise.
 *
 * @param fn - The function to wrap.
 * @returns The wrapped function.
 */
const withNoopOutsideLocal =
  (fn: (...args: any[]) => void) =>
  (...args: any[]) => {
    if (!isLocal) {
      return;
    }
    fn(...args);
  };

/**
 * A basic logger that wraps the console, extending its functionality to properly log Solana errors.
 */
const logger: ILogger = {
  log: withNoopOutsideLocal(console.log),
  info: withNoopOutsideLocal(console.info),
  warn: withNoopOutsideLocal(console.warn),
  debug: withNoopOutsideLocal(console.debug),
  error: withNoopOutsideLocal(withSolanaErrorLogging(console.error)),
};

export default logger;
