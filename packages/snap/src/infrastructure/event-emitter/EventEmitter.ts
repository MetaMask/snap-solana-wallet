/* eslint-disable no-void */
import type { ILogger } from '../../core/utils/logger';

/**
 * The EventEmitter class is a simple event emitter that allows to register listeners / callbacks for events and emit events.
 *
 * @example
 * ```ts
 * const eventEmitter = new EventEmitter();
 * eventEmitter.on('someEvent', () => {
 *   someFunction();
 * });
 * eventEmitter.emit('someEvent');
 * // 'someFunction' will be called
 * ```
 */
export class EventEmitter {
  readonly #logger: ILogger;

  readonly #loggerPrefix = '[⚡ EventEmitter]';

  readonly #listeners: Map<string, Set<(data?: any) => Promise<void>>> =
    new Map();

  constructor(logger: ILogger) {
    this.#logger = logger;
  }

  /**
   * Registers a listener for an event.
   * @param event - The event to listen to.
   * @param listener - The listener to call when the event is emitted.
   */
  on(event: string, listener: (data?: any) => Promise<void>) {
    this.#logger.info(this.#loggerPrefix, `Adding listener for event ${event}`);

    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }

    this.#listeners.get(event)?.add(listener);
  }

  /**
   * Removes a listener for an event.
   * @param event - The event to remove the listener for.
   * @param listener - The listener to remove.
   */
  off(event: string, listener: (data?: any) => Promise<void>) {
    this.#logger.info(
      this.#loggerPrefix,
      `Removing listener for event ${event}`,
    );

    const listeners = this.#listeners.get(event);
    if (listeners) {
      listeners.delete(listener);

      // Clean up empty sets
      if (listeners.size === 0) {
        this.#listeners.delete(event);
      }
    }
  }

  /**
   * Emits an event in a non-blocking / "fire and forget" manner.
   * The event is emitted to all listeners, and the function returns immediately.
   * The listeners are executed concurrently, and the function does not wait for them to complete.
   * @param event - The event to emit.
   * @param data - The data to pass to the listeners.
   */
  emit(event: string, data?: any) {
    this.#logger.info(this.#loggerPrefix, `Emitting event ${event}`);
    const listeners = this.#listeners.get(event);

    if (listeners) {
      // Execute all listeners concurrently
      const promises = Array.from(listeners).map(async (listener) =>
        listener(data),
      );
      void Promise.allSettled(promises);
    }
  }

  /**
   * Removes all listeners for an event.
   * @param event - The event to remove the listeners for. If not provided, all listeners will be removed.
   */
  removeAllListeners(event?: string) {
    if (event) {
      this.#logger.info(
        this.#loggerPrefix,
        `Removing all listeners for event ${event}`,
      );
      this.#listeners.delete(event);
    } else {
      this.#logger.info(
        this.#loggerPrefix,
        `Removing all listeners for all events`,
      );
      this.#listeners.clear();
    }
  }

  /**
   * Returns the number of listeners for an event.
   * @param event - The event to get the listener count for.
   * @returns The number of listeners for the event.
   */
  listenerCount(event: string): number {
    const listeners = this.#listeners.get(event);
    return listeners ? listeners.size : 0;
  }

  /**
   * Returns the names of all events that have listeners.
   * @returns The names of all events that have listeners.
   */
  eventNames(): string[] {
    return Array.from(this.#listeners.keys());
  }
}
