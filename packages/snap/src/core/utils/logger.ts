/**
 * A simple logger utility that provides methods for logging messages at different levels.
 *
 * @namespace logger
 */

export type ILogger = {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
};

// eslint-disable-next-line no-restricted-globals
const isLocal = Boolean(process.env.LOCAL);

const logger: ILogger = {
  log: (...args: any[]) => {
    if (!isLocal) {
      return;
    }

    console.log(
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    );
  },
  info: (...args: any[]) => {
    if (!isLocal) {
      return;
    }

    console.info(
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    );
  },
  warn: (...args: any[]) => {
    if (!isLocal) {
      return;
    }

    console.warn(
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    );
  },
  error: (...args: any[]) =>
    console.error(
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    ),
  debug: (...args: any[]) => {
    if (!isLocal) {
      return;
    }

    console.debug(
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    );
  },
};

export default logger;
