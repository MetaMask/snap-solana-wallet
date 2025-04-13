/* eslint-disable import/no-unassigned-import */
import 'reflect-metadata';

import type { Serializable } from '../serialization/types';
import type { ICache } from './ICache';

type CacheOptions = {
  /**
   * The time to live for the cache in milliseconds.
   */
  ttlMilliseconds: number;
  /**
   * A function that returns the cache to use.
   */
  getCache: (instance: any) => ICache<Serializable>;
  /**
   * Optional function to generate the cache key for the method.
   * Defaults to a function that generates the key in the style "PriceApiClient:getHistoricalPrices:[json stringified args separated by colons]"
   */
  generateCacheKey?: (instance: any, args: any[]) => string;
};

/**
 * Default function to generate the cache key for the method.
 *
 * @param instance - The instance of the class.
 * @param propertyKey - The property key of the method.
 * @param args - The arguments of the method.
 * @returns The cache key.
 */
const defaultGenerateCacheKey = (
  instance: any,
  propertyKey: string | symbol,
  args: any[],
) =>
  `${instance.constructor.name}:${String(propertyKey)}:${args
    .map((arg) => JSON.stringify(arg))
    .join(':')}`;

/**
 * Decorator to cache the result of a method.
 *
 * @param options - The options for the cache.
 * @param options.ttlMilliseconds - The time to live for the cache in milliseconds.
 * @param options.getCache - A function that returns the cache to use.
 * @param options.generateCacheKey - A function that generates the cache key for the method.
 * @returns The decorator.
 */
export const UseCache = ({
  ttlMilliseconds,
  getCache,
  generateCacheKey,
}: CacheOptions) => {
  return (
    _target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    if (!originalMethod) {
      return descriptor;
    }

    // Create the method that will be used to generate the cache key
    const _generateCacheKey =
      generateCacheKey ??
      ((instance: any, args: any[]) =>
        defaultGenerateCacheKey(instance, propertyKey, args));

    descriptor.value = async function (...args: any[]) {
      const cache = getCache(this);
      const cacheKey = _generateCacheKey(this, args);

      // Check if the data is cached
      const cached = await cache.get(cacheKey).catch(() => undefined);
      if (cached) {
        return cached;
      }

      // Execute the original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      await cache.set(cacheKey, result, ttlMilliseconds).catch(() => {
        // Silently fail if cache set fails
      });

      return result;
    };

    return descriptor;
  };
};
