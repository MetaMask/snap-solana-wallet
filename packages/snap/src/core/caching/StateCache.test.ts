/* eslint-disable jest/prefer-strict-equal */
/* eslint-disable @typescript-eslint/naming-convention */
import { InMemoryState } from '../services/state/InMemoryState';
import { StateCache } from './StateCache';

describe('StateCache', () => {
  describe('constructor', () => {
    it('uses the default prefix if not specified', () => {
      const cache = new StateCache(new InMemoryState({}));

      expect(cache.prefix).toBe('__cache__default');
    });

    it('uses the specified prefix if provided', () => {
      const cache = new StateCache(
        new InMemoryState({}),
        undefined,
        '__cache__my-prefix',
      );

      expect(cache.prefix).toBe('__cache__my-prefix');
    });
  });

  describe('get', () => {
    it('returns undefined if the cache is not initialized', async () => {
      const stateWithNoCache = new InMemoryState({
        name: 'John', // State has some data that is not related to the cache
        // __cache__default: {}   // State has not been initialized with cached data
      });
      const cache = new StateCache(stateWithNoCache);

      const value = await cache.get('someKey');

      expect(value).toBeUndefined();
    });

    it('returns undefined if the cache is initialized but the key is not present', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: 1704067200000, // January 1, 2024
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const value = await cache.get('someOtherKey');

      expect(value).toBeUndefined();
    });

    it('returns the cached value if the cache is initialized and the key is present and not expired', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER, // Expires in a long time
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const value = await cache.get('someKey');

      expect(value).toBe('someValue');
    });

    it('returns undefined if the cache is initialized and the key is present but expired', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: 1704067200000, // January 1, 2024
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const value = await cache.get('someKey');

      expect(value).toBeUndefined();
    });

    it('deletes expired cache entries upon retrieval', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: 1704067200000, // January 1, 2024
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      await cache.get('someKey');
      const stateValue = await stateWithCache.get();

      expect(stateValue).toStrictEqual({
        __cache__default: {},
      });
    });
  });

  describe('set', () => {
    it('initializes the cache if it is not initialized', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      await cache.set('someKey', 'someValue');
      const stateValue = await stateWithCache.get();

      expect(stateValue).toStrictEqual({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
    });

    it('sets the cache entry with no expiration if no ttl is provided', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {},
      });
      const cache = new StateCache(stateWithCache);

      await cache.set('someKey', 'someValue');
      const stateValue = await stateWithCache.get();

      const value = await cache.get('someKey');

      expect(value).toBe('someValue');
      expect(stateValue).toStrictEqual({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
    });

    it('overwrites the cache entry if it is present', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      await cache.set('someKey', 'someOtherValue');
      const stateValue = await stateWithCache.get();

      expect(stateValue).toStrictEqual({
        __cache__default: {
          someKey: {
            value: 'someOtherValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
    });

    it('sets the cache entry with the provided ttl', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {},
      });
      const cache = new StateCache(stateWithCache);
      jest.spyOn(Date, 'now').mockReturnValueOnce(1704067200000); // January 1, 2024

      await cache.set('someKey', 'someValue', 1000);
      const stateValue = await stateWithCache.get();

      expect(stateValue).toStrictEqual({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: 1704067201000, // January 1, 2024 + 1 second
          },
        },
      });
    });

    it('supports a ttl of 0', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {},
      });
      const cache = new StateCache(stateWithCache);
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1704067200000) // January 1, 2024
        .mockReturnValueOnce(1704067200001); // January 1, 2024 + 1 millisecond

      await cache.set('someKey', 'someValue', 0);
      const stateValue = await stateWithCache.get();

      expect(stateValue).toStrictEqual({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: 1704067200000, // January 1, 2024 (+ 0 seconds)
          },
        },
      });

      const value = await cache.get('someKey'); // Should expire immediately
      expect(value).toBeUndefined();
    });

    it('throws an error if the ttl is not a number', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {},
      });
      const cache = new StateCache(stateWithCache);

      await expect(
        cache.set('someKey', 'someValue', 'not a number' as unknown as number),
      ).rejects.toThrow('TTL must be a number');
    });

    it('throws an error if the ttl is negative', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {},
      });
      const cache = new StateCache(stateWithCache);

      await expect(cache.set('someKey', 'someValue', -1)).rejects.toThrow(
        'TTL must be positive',
      );
    });

    it('throws an error if the ttl is too large', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {},
      });
      const cache = new StateCache(stateWithCache);

      await expect(
        cache.set('someKey', 'someValue', Number.MAX_SAFE_INTEGER + 1),
      ).rejects.toThrow('TTL must be less than 2^53 - 1');
    });
  });

  describe('delete', () => {
    it('deletes the cache entry and returns true if the entry was present', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.delete('someKey');
      expect(result).toBe(true);

      const value = await cache.get('someKey');

      expect(value).toBeUndefined();
    });

    it('leaves the cache unchanged and returns false if the entry was not present', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.delete('someOtherKey'); // Try to
      const someKeyValue = await cache.get('someKey');
      const someOtherKeyValue = await cache.get('someOtherKey');

      expect(result).toBe(false);
      expect(someKeyValue).toBe('someValue');
      expect(someOtherKeyValue).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('empties the cache', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
            createdAt: 1704067200000, // January 1, 2024
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      await cache.clear();
      const stateValue = await stateWithCache.get();

      expect(stateValue).toStrictEqual({
        __cache__default: {},
      });
    });

    it('does not throw an error if the cache is not initialized', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      await cache.clear();
      const stateValue = await stateWithCache.get();

      expect(stateValue).toStrictEqual({
        __cache__default: {},
      });
    });
  });

  describe('has', () => {
    it('returns true if the key is present in the cache', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.has('someKey');

      expect(result).toBe(true);
    });

    it('returns false if the key is not present in the cache', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.has('someOtherKey');
      expect(result).toBe(false);
    });

    it('does not throw an error if the cache is not initialized', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      const result = await cache.has('someKey');
      expect(result).toBe(false);
    });
  });

  describe('keys', () => {
    it('returns all keys in the cache', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
          someOtherKey: {
            value: 'someOtherValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.keys();

      expect(result).toStrictEqual(['someKey', 'someOtherKey']);
    });

    it('returns an empty array if the cache is not initialized', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      const result = await cache.keys();

      expect(result).toStrictEqual([]);
    });
  });

  describe('size', () => {
    it('returns the number of items in the cache', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
          someOtherKey: {
            value: 'someOtherValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.size();

      expect(result).toBe(2);
    });

    it('returns 0 if the cache is not initialized', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      const result = await cache.size();

      expect(result).toBe(0);
    });
  });

  describe('peek', () => {
    it('returns the value of an unexpired key if it is present in the cache', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.peek('someKey');

      expect(result).toBe('someValue');
    });

    it('returns the value of an expired key if it is present in the cache', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: 1704067200000, // January 1, 2024
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.peek('someKey');

      expect(result).toBe('someValue');
    });

    it('returns undefined if the key is not present in the cache', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      const result = await cache.peek('someOtherKey');

      expect(result).toBeUndefined();
    });

    it('does not throw an error if the cache is not initialized', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      const result = await cache.peek('someKey');
      expect(result).toBeUndefined();
    });
  });

  describe('mget', () => {
    it('returns the values of the keys if they are present in the cache', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
          someOtherKey: {
            value: 'someOtherValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.mget(['someKey', 'someOtherKey']);

      expect(result).toStrictEqual({
        someKey: 'someValue',
        someOtherKey: 'someOtherValue',
      });
    });

    it('returns undefined for keys that are not present in the cache', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.mget(['someKey', 'someOtherKey']);

      expect(result).toEqual({
        someKey: 'someValue',
        someOtherKey: undefined,
      });
    });

    it('returns undefined for keys that are expired', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: 1704067200000, // January 1, 2024
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.mget(['someKey']);

      expect(result).toEqual({
        someKey: undefined,
      });
    });

    it('returns an empty object if the cache is not initialized', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      const result = await cache.mget(['someKey', 'someOtherKey']);

      expect(result).toStrictEqual({});
    });

    it('deletes expired cache entries upon retrieval', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: 1704067200000, // January 1, 2024
          },
          someOtherKey: {
            value: 'someOtherValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      await cache.mget(['someKey']);
      const stateValue = await stateWithCache.get();

      expect(stateValue).toStrictEqual({
        __cache__default: {
          someOtherKey: {
            value: 'someOtherValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
    });
  });

  describe('mset', () => {
    it('sets the values of the keys if they are present in the cache', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      await cache.mset([
        { key: 'someKey', value: 'someValue' },
        { key: 'someOtherKey', value: 'someOtherValue' },
      ]);

      const result = await cache.mget(['someKey', 'someOtherKey']);

      expect(result).toStrictEqual({
        someKey: 'someValue',
        someOtherKey: 'someOtherValue',
      });
    });

    it('does not store undefined values in the cache', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      await cache.mset([
        { key: 'someKey', value: 'someValue' },
        { key: 'undefinedKey', value: undefined },
      ]);

      const result = await cache.mget(['someKey', 'undefinedKey']);

      expect(result).toEqual({
        someKey: 'someValue',
        undefinedKey: undefined,
      });

      // Verify the undefined value was not stored in the cache
      const stateValue = await stateWithCache.get();
      expect(stateValue).toStrictEqual({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
    });

    it('stores null values in the cache', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      await cache.mset([{ key: 'someKey', value: null }]);

      const result = await cache.mget(['someKey']);

      expect(result).toStrictEqual({
        someKey: null,
      });
    });

    it('does not throw an error if the cache is not initialized', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      await cache.mset([{ key: 'someKey', value: 'someValue' }]);

      const result = await cache.mget(['someKey']);

      expect(result).toStrictEqual({
        someKey: 'someValue',
      });
    });

    it('throws an error if the ttl is invalid', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      await expect(
        cache.mset([
          {
            key: 'someKey',
            value: 'someValue',
            ttlMilliseconds: 'not a number' as unknown as number,
          },
        ]),
      ).rejects.toThrow('TTL must be a number');
    });

    it('does not affect other keys in the cache', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey0: {
            value: 'someValue0',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
          someKey1: {
            value: 'someValue1',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      await cache.mset([
        { key: 'someKey0', value: 'someValue0Overwritten' },
        { key: 'someKey2', value: 'someValue2' },
      ]);

      const result = await cache.mget(['someKey0', 'someKey1', 'someKey2']);

      expect(result).toStrictEqual({
        someKey0: 'someValue0Overwritten',
        someKey1: 'someValue1',
        someKey2: 'someValue2',
      });
    });

    it('no-ops if no entries are provided', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);
      const updateSpy = jest.spyOn(stateWithCache, 'update');

      await cache.mset([]);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('defers to set if there is only one entry', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);
      const setSpy = jest.spyOn(cache, 'set');

      const singleEntry = {
        key: 'someKey',
        value: 'someValue',
        ttlMilliseconds: 1000,
      };
      await cache.mset([singleEntry]);

      expect(setSpy).toHaveBeenCalledWith(
        singleEntry.key,
        singleEntry.value,
        singleEntry.ttlMilliseconds,
      );
    });
  });

  describe('mdelete', () => {
    it('deletes the keys from the cache', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
          someOtherKey: {
            value: 'someOtherValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      await cache.mdelete(['someKey', 'someOtherKey']);

      const result = await cache.mget(['someKey', 'someOtherKey']);

      expect(result).toEqual({
        someKey: undefined,
        someOtherKey: undefined,
      });
    });

    it('returns an object where the values are true if the keys were deleted and false if they were not present', async () => {
      const stateWithCache = new InMemoryState({
        __cache__default: {
          someKey: {
            value: 'someValue',
            expiresAt: Number.MAX_SAFE_INTEGER,
          },
        },
      });
      const cache = new StateCache(stateWithCache);

      const result = await cache.mdelete(['someKey', 'someOtherKey']);

      expect(result).toStrictEqual({
        someKey: true,
        someOtherKey: false,
      });
    });

    it('does not throw an error if the cache is not initialized', async () => {
      const stateWithCache = new InMemoryState({});
      const cache = new StateCache(stateWithCache);

      const result = await cache.mdelete(['someKey', 'someOtherKey']);

      expect(result).toStrictEqual({
        someKey: false,
        someOtherKey: false,
      });
    });
  });
});
