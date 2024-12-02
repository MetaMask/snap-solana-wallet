export type IStack<TItem> = {
  push: (item: TItem) => void;
  pop: () => TItem | undefined;
  size: () => number;
};

export type StackItem<TItem> = {
  value: TItem;
  isDestackable: boolean;
};

/**
 * A stack implementation that allows for non-destackable items to be returned
 * without removing them from the stack.
 */
export class Stack<TItem> implements IStack<TItem> {
  readonly #capacity: number;

  readonly #storage: StackItem<TItem>[] = [];

  constructor(capacity = Infinity) {
    this.#capacity = capacity;
  }

  push(item: TItem, isDestackable = true): void {
    if (this.size() === this.#capacity) {
      throw Error('Stack has reached max capacity, you cannot add more items');
    }
    this.#storage.push({ value: item, isDestackable });
  }

  pop(): TItem | undefined {
    const lastItem = this.#storage[this.#storage.length - 1];

    if (!lastItem) {
      return undefined;
    }

    if (lastItem.isDestackable) {
      // Remove the item from the stack and return it
      return this.#storage.pop()?.value;
    }
    // Return the item without removing it from the stack
    return lastItem.value;
  }

  size(): number {
    return this.#storage.length;
  }

  peek(): TItem | undefined {
    return this.#storage[this.#storage.length - 1]?.value;
  }
}
