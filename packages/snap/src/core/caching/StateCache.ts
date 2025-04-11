/* eslint-disable @typescript-eslint/naming-convention */
import type { Serializable } from '../serialization/types';
import type { IStateManager } from '../services/state/IStateManager';
import type { ICache } from './ICache';

export type CacheValue = Record<string, Serializable> | undefined;
export type StateValue = { [x: string]: Serializable } & {
  __cache?: CacheValue;
};

/**
 * A prefix for the cache in the state.
 *
 * It must start with `__` to avoid conflicts with other state values.
 */
export type CachePrefix = `__${string}`;

/**
 * A cache that wraps any implementation of the `IStateManager` interface to store the cache.
 *
 * It is intended to be used with the snap's `State` class, but can be used with any other implementation of the `IStateManager` interface. For instance it can be used with the `InMemoryState` class for testing purposes.
 *
 * By default, it stores its data in the `__cache` property of the state, but you can specify any other prefix you want, provided it starts with `__` to avoid collisions with other state values.
 *
 * ```
 * {
 *    ..., // other state values
 *    __cache: {
 *      key1: value1,
 *      key2: value2,
 *    },
 * }
 * ```
 *
 * @example
 * ```ts
 * const state = new State({}); // Here we use the real snap's state
 * const cache = new StateCache(state, '__my-prefix');
 *
 * // state looks like this:
 * // {
 * //   ..., // other state values
 *     // no __cache yet
 * // }
 *
 * await cache.set('key1', 'value1');
 *
 * // state looks like this:
 * // {
 * //   ..., // other state values
 * //   __my-prefix: {
 * //     key1: value1,
 * //   },
 * // }
 * ```
 * @param state - An instance of `IStateManager` to manage the state storage.
 * @param prefix - A string prefix used to namespace the cache within the state. Defaults to '__cache'.
 */
export class StateCache implements ICache<CacheValue> {
  #state: IStateManager<StateValue>;

  public readonly prefix: `__${string}`;

  constructor(
    state: IStateManager<StateValue>,
    prefix: CachePrefix = '__cache',
  ) {
    this.#state = state;
    this.prefix = prefix;
  }

  async get(key: string): Promise<CacheValue> {
    const value = await this.#state.get();
    const cache = value[this.prefix] as
      | Record<string, Serializable>
      | undefined;
    const valueFromCache = cache?.[key];

    return typeof valueFromCache === 'undefined'
      ? undefined
      : (valueFromCache as CacheValue);
  }

  //   async set(
  //     key: string,
  //     value: Serializable,
  //     ttlSeconds?: number,
  //   ): Promise<void> {
  //     throw new Error('Method not implemented.');
  //   }

  //   async delete(key: string): Promise<boolean> {
  //     throw new Error('Method not implemented.');
  //   }

  //   async clear(): Promise<void> {
  //     throw new Error('Method not implemented.');
  //   }

  //   async has(key: string): Promise<boolean> {
  //     throw new Error('Method not implemented.');
  //   }

  //   async keys(): Promise<string[]> {
  //     throw new Error('Method not implemented.');
  //   }

  //   async size(): Promise<number> {
  //     throw new Error('Method not implemented.');
  //   }

  //   async peek(key: string): Promise<Serializable | undefined> {
  //     throw new Error('Method not implemented.');
  //   }

  //   async mget(
  //     keys: string[],
  //   ): Promise<Record<string, Serializable | undefined>> {
  //     throw new Error('Method not implemented.');
  //   }

  //   async mset(
  //     entries: { key: string; value: Serializable; ttlSeconds?: number }[],
  //   ): Promise<void> {
  //     throw new Error('Method not implemented.');
  //   }
}
