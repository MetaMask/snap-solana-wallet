import type { Serializable } from '../serialization/types';
import type { ICache } from './ICache';

/**
 * A simple in-memory cache implementation, primarily used for testing purposes.
 *
 * WARNINGS:
 * - This cache is not persistent and will be lost when the process is restarted.
 * - It does not support TTL.
 */
export class InMemoryCache implements ICache<Serializable> {
  #cache: Map<string, Serializable> = new Map();

  async get(key: string): Promise<Serializable | undefined> {
    return this.#cache.get(key);
  }

  async set(
    key: string,
    value: Serializable,
    _ttlMilliseconds?: number,
  ): Promise<void> {
    this.#cache.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    return this.#cache.delete(key);
  }

  async clear(): Promise<void> {
    this.#cache.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.#cache.has(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.#cache.keys());
  }

  async size(): Promise<number> {
    return this.#cache.size;
  }

  async peek(key: string): Promise<Serializable | undefined> {
    return this.#cache.get(key);
  }

  async mget(keys: string[]): Promise<Record<string, Serializable>> {
    return Object.fromEntries(
      keys.map((key) => [key, this.#cache.get(key)]),
    ) as Record<string, Serializable>;
  }

  async mset(
    entries: { key: string; value: Serializable; _ttlMilliseconds?: number }[],
  ): Promise<void> {
    entries.forEach(({ key, value }) => {
      this.#cache.set(key, value);
    });
  }

  async mdelete(keys: string[]): Promise<Record<string, boolean>> {
    return Object.fromEntries(
      keys.map((key) => [key, this.#cache.delete(key)]),
    ) as Record<string, boolean>;
  }
}
