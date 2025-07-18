import { get, set, unset } from 'lodash';

import type { Serializable } from '../../serialization/types';
import type { IStateManager } from './IStateManager';

/**
 * A simple implementation of the `IStateManager` interface that relies on an in memory state that can be used for testing purposes.
 */
export class InMemoryState<TStateValue extends Record<string, Serializable>>
  implements IStateManager<TStateValue>
{
  #state: TStateValue;

  constructor(initialState: TStateValue) {
    this.#state = initialState;
  }

  async get(): Promise<TStateValue> {
    return this.#state;
  }

  async getKey<TResponse extends Serializable>(
    key: string,
  ): Promise<TResponse | undefined> {
    const value = get(this.#state, key);

    return value as TResponse | undefined;
  }

  async setKey(key: string, value: Serializable): Promise<void> {
    set(this.#state, key, value); // Use lodash to set the value using a json path
  }

  async update(
    callback: (state: TStateValue) => TStateValue,
  ): Promise<TStateValue> {
    this.#state = callback(this.#state);

    return this.#state;
  }

  async deleteKey(key: string): Promise<void> {
    // Using lodash's unset to leverage the json path capabilities
    unset(this.#state, key);
  }

  async deleteKeys(keys: string[]): Promise<void> {
    keys.forEach((key) => {
      unset(this.#state, key);
    });
  }
}
