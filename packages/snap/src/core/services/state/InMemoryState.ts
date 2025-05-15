import { set, unset } from 'lodash';

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

  async set(key: string, value: Serializable): Promise<void> {
    set(this.#state, key, value); // Use lodash to set the value using a json path
  }

  async update(
    callback: (state: TStateValue) => TStateValue,
  ): Promise<TStateValue> {
    this.#state = callback(this.#state);

    return this.#state;
  }

  async delete(key: string): Promise<void> {
    // Using lodash's unset to leverage the json path capabilities
    unset(this.#state, key);
  }
}
