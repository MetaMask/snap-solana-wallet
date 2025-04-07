import type { IStateManager } from '../IStateManager';

/**
 * A simple implementation of the `IStateManager` interface that relies on an in memory state that can be used for testing purposes.
 */
export class InMemoryState<TStateValue extends object>
  implements IStateManager<TStateValue>
{
  #state: TStateValue;

  constructor(initialState: TStateValue) {
    this.#state = initialState;
  }

  async get(): Promise<TStateValue> {
    return this.#state;
  }

  async update(
    callback: (state: TStateValue) => TStateValue,
  ): Promise<TStateValue> {
    this.#state = callback(this.#state);

    return this.#state;
  }
}
