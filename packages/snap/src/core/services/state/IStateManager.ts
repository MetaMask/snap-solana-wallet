export type IStateManager<TStateValue> = {
  /**
   * Gets the whole state object.
   *
   * @returns The state of the snap.
   */
  get(): Promise<TStateValue>;
  /**
   * Sets the value of passed key in the state object.
   * The key is a json path to the value to set.
   *
   * @example
   * ```typescript
   * const state = await stateManager.get();
   * // state is { users: [ { name: 'Alice', age: 20 }, { name: 'Bob', age: 25 } ] }
   *
   * await stateManager.set('users.1.name', 'John');
   * // state is now { users: [ { name: 'Alice', age: 20 }, { name: 'John', age: 25 } ] }
   * ```
   * @param key - The key to set.
   * @param value - The value to set.
   */
  set(key: string, value: any): Promise<void>;
  /**
   * Updates the whole state object.
   *
   * WARNING: Use with caution because:
   * - it will override the whole state.
   * - it transfers the whole state to the snap, which might contain a lot of data.
   *
   * Prefer using `state.update` for bulk `set`s or `delete`s, because:
   * - Atomicity: Using a single `state.update` ensures that all changes are applied atomically. If any part of the operation fails, none of the changes will be applied. This prevents partial updates that could leave the underlying data store in an inconsistent state.
   * - Performance: Making multiple individual `state.set` or `state.delete` calls would require multiple round trips to the state storage system, causing potential overheads.
   * - State Consistency: Maintains better state consistency by reading the state once, making all modifications in memory and writing the complete updated state back.
   *
   * @param updaterFunction - The function that updates the state.
   * @returns The updated state.
   */
  update(
    updaterFunction: (state: TStateValue) => TStateValue,
  ): Promise<TStateValue>;
  /**
   * Deletes the value of passed key in the state object.
   * The key is a json path to the value to delete.
   *
   * @example
   * ```typescript
   * const state = await stateManager.get();
   * // state is { users: [ { name: 'Alice', age: 20 }, { name: 'Bob', age: 25 } ] }
   *
   * await stateManager.delete('users.1');
   * // state is now { users: [ { name: 'Alice', age: 20 } ] }
   * ```
   */
  delete(key: string): Promise<void>;
};
