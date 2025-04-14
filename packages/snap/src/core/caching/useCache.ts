/* eslint-disable no-void */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Serializable } from '../serialization/types';
import type { ICache } from './ICache';

/**
 * Options for configuring the caching behavior of a function.
 */
export type CacheOptions = {
  /**
   * The time to live for the cache in milliseconds.
   */
  ttlMilliseconds: number;
  /**
   * Set this if you want to use a custom function name for the cache key.
   */
  functionName?: string;
  /**
   * Optional function to generate the cache key for the function call.
   * Defaults to a function that generates the key based on function name and JSON stringified args separated by colons.
   */
  generateCacheKey?: (functionName: string, args: any[]) => string;
};

/**
 * Default function to generate the cache key for a function call.
 *
 * @param functionName - The name of the function.
 * @param args - The arguments of the function call.
 * @returns The cache key.
 */
const defaultGenerateCacheKey = (functionName: string, args: any[]) =>
  `${functionName}:${args.map((arg) => JSON.stringify(arg)).join(':')}`;

/**
 * Wraps a function with caching behavior.
 *
 * @template TArgs - Tuple type representing the arguments of the function.
 * @template TResult - The return type of the function, must be Serializable.
 * @param fn - The asynchronous function to wrap. Must return a Promise<Serializable>.
 * @param cache - The cache instance to use.
 * @param options - The caching options.
 * @param options.ttlMilliseconds - The time to live for the cache in milliseconds.
 * @param options.functionName - The name of the function.
 * @param options.generateCacheKey - Optional function to generate the cache key.
 * @returns A new asynchronous function with caching behavior.
 */
export const useCache = <TArgs extends any[], TResult extends Serializable>(
  fn: (...args: TArgs) => Promise<TResult>,
  cache: ICache<Serializable>,
  { ttlMilliseconds, functionName, generateCacheKey }: CacheOptions,
): ((...args: TArgs) => Promise<TResult>) => {
  // Use provided key generator or default, adapting the default to use the function's name
  const _generateCacheKey = generateCacheKey ?? defaultGenerateCacheKey;

  // Get the function name for the default key generator, handle anonymous functions
  const _functionName = functionName ?? fn.name ?? 'anonymousFunction';

  return async (...args: TArgs): Promise<TResult> => {
    const cacheKey = _generateCacheKey(_functionName, args);

    // Check if the data is cached
    try {
      const cached = await cache.get(cacheKey);
      // Check explicitly for undefined, as null or other falsy values might be valid cache results
      if (cached !== undefined) {
        // Type assertion because cache stores Serializable, but we expect TResult
        return cached as TResult;
      }
    } catch (error) {
      // Log cache get errors but proceed to execute the function
      console.error(`Cache get error for key "${cacheKey}":`, error);
    }

    // Execute the original function
    const result = await fn(...args);

    // Cache the result, handle potential errors silently
    // We don't await this, allowing it to happen in the background
    void cache.set(cacheKey, result, ttlMilliseconds).catch((error) => {
      console.error(`Cache set error for key "${cacheKey}":`, error);
    });

    return result;
  };
};
