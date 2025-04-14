/* eslint-disable @typescript-eslint/naming-convention */

import type { Serializable } from '../serialization/types';
import type { IStateManager } from '../services/state/IStateManager';
import type { ICache } from './ICache';

export type TimestampMilliseconds = number;

/**
 * A single cache entry.
 */
export type CacheEntry = {
  value: Serializable;
  expiresAt: TimestampMilliseconds;
};

/**
 * The whole cache store.
 */
export type CacheStore = Record<string, CacheEntry> | undefined;

/**
 * A prefix for the cache "location" in the state. Enforced to start with `__cache__` to avoid collisions with other state values.
 */
export type CachePrefix = `__cache__${string}`;

/**
 * Describes the shape of the whole state inside which the cache is stored.
 */
export type StateValue = {
  [x: string]: Serializable;
} & {
  [K in CachePrefix]?: CacheStore;
};

/**
 * A cache that wraps any implementation of the `IStateManager` interface to store the cache.
 *
 * It is intended to be used with the snap's `State` class, but can be used with any other implementation of the `IStateManager` interface. For instance it can be used with the `InMemoryState` class for testing purposes.
 *
 * By default, it stores its data in the `__cache__default` property of the state, but you can specify any other prefix you want, provided it starts with `__cache__` to avoid collisions with other state values.
 * This is useful if you want to have multiple independent caches in the same state.
 *
 * ```
 * {
 *    ..., // other state values
 *    __cache__default: {
 *      key1: value1,
 *      key2: value2,
 *    },
 *    __cache__my-prefix: {
 *      key3: value3,
 *      key4: value4,
 *    },
 * }
 * ```
 *
 * @example
 * ```ts
 * const state = new State({}); // Here we use the real snap's state
 * const cache = new StateCache(state, '__cache__my-prefix');
 *
 * // state looks like this:
 * // {
 * //   ..., // other state values
 *     // no __cache__my-prefix yet
 * // }
 *
 * await cache.set('key1', 'value1');
 *
 * // state looks like this:
 * // {
 * //   ..., // other state values
 * //   __cache__my-prefix: {
 * //     key1: value1,
 * //   },
 * // }
 * ```
 */
export class StateCache implements ICache<Serializable | undefined> {
  #state: IStateManager<StateValue>;

  public readonly prefix: CachePrefix;

  constructor(
    state: IStateManager<StateValue>,
    prefix: CachePrefix = '__cache__default',
  ) {
    this.#state = state;
    this.prefix = prefix;
  }

  async get(key: string): Promise<Serializable | undefined> {
    const result = await this.mget([key]);
    return result[key];
  }

  async set(
    key: string,
    value: Serializable,
    ttlMilliseconds = Number.MAX_SAFE_INTEGER,
  ): Promise<void> {
    await this.mset([{ key, value, ttlMilliseconds }]);
  }

  #validateTtlOrThrow(ttlMilliseconds?: number): void {
    if (ttlMilliseconds === undefined) {
      return;
    }

    if (typeof ttlMilliseconds !== 'number') {
      throw new Error('TTL must be a number');
    }

    if (ttlMilliseconds < 0) {
      throw new Error('TTL must be positive');
    }

    if (ttlMilliseconds > Number.MAX_SAFE_INTEGER) {
      throw new Error('TTL must be less than 2^53 - 1');
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.mdelete([key]);
    return result[key] ?? false;
  }

  async clear(): Promise<void> {
    await this.#state.update((stateValue) => {
      stateValue[this.prefix] = {};
      return stateValue;
    });
  }

  async has(key: string): Promise<boolean> {
    const result = await this.get(key);
    return result !== undefined;
  }

  async keys(): Promise<string[]> {
    const stateValue = await this.#state.get();
    const cacheStore = stateValue[this.prefix];

    return Object.keys(cacheStore ?? {});
  }

  async size(): Promise<number> {
    const stateValue = await this.#state.get();
    const cacheStore = stateValue[this.prefix];

    return Object.keys(cacheStore ?? {}).length;
  }

  async peek(key: string): Promise<Serializable | undefined> {
    const stateValue = await this.#state.get();
    const cacheStore = stateValue[this.prefix];
    const cacheEntry = cacheStore?.[key];

    return cacheEntry?.value;
  }

  async mget(
    keys: string[],
  ): Promise<Record<string, Serializable | undefined>> {
    const stateValue = await this.#state.get();
    const cacheStore = stateValue[this.prefix];

    const keysAndValues = Object.entries(cacheStore ?? {}).filter(([key]) =>
      keys.includes(key),
    );

    const expiredKeys = keysAndValues.filter(
      ([_, cacheEntry]) => cacheEntry && cacheEntry.expiresAt < Date.now(),
    );

    await this.mdelete(expiredKeys.map(([key]) => key));

    return keysAndValues.reduce<Record<string, Serializable | undefined>>(
      (acc, [key, cacheEntry]) => {
        if (cacheEntry === undefined) {
          return acc;
        }

        if (cacheEntry.expiresAt < Date.now()) {
          acc[key] = undefined;
        } else {
          acc[key] = cacheEntry.value;
        }

        return acc;
      },
      {},
    );
  }

  async mset(
    entries: { key: string; value: Serializable; ttlMilliseconds?: number }[],
  ): Promise<void> {
    entries.forEach(({ ttlMilliseconds }) => {
      this.#validateTtlOrThrow(ttlMilliseconds);
    });

    await this.#state.update((stateValue) => {
      const cacheStore = stateValue[this.prefix] ?? {};
      entries.forEach(({ key, value, ttlMilliseconds }) => {
        if (value === undefined) {
          return;
        }
        cacheStore[key] = {
          value,
          expiresAt: Math.min(
            Date.now() + (ttlMilliseconds ?? Number.MAX_SAFE_INTEGER),
            Number.MAX_SAFE_INTEGER,
          ),
        };
      });
      stateValue[this.prefix] = cacheStore;
      return stateValue;
    });
  }

  async mdelete(keys: string[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};

    await this.#state.update((stateValue) => {
      const cacheStore = stateValue[this.prefix] ?? {};
      keys.forEach((key) => {
        if (cacheStore[key] === undefined) {
          result[key] = false;
        } else {
          delete cacheStore[key];
          result[key] = true;
        }
      });
      stateValue[this.prefix] = cacheStore;
      return stateValue;
    });

    return result;
  }
}
