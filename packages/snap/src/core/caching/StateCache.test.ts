/* eslint-disable @typescript-eslint/naming-convention */
import { InMemoryState } from '../services/state/mocks/InMemoryState';
import { StateCache } from './StateCache';

describe('StateCache', () => {
  describe('constructor', () => {
    it('uses the default prefix if not specified', () => {
      const cache = new StateCache(new InMemoryState({}));

      expect(cache.prefix).toBe('__cache');
    });

    it('uses the specified prefix if provided', () => {
      const cache = new StateCache(new InMemoryState({}), '__my-prefix');

      expect(cache.prefix).toBe('__my-prefix');
    });
  });

  describe('get', () => {
    it('returns undefined if the cache is not initialized', async () => {
      const stateWithNoCache = new InMemoryState({
        name: 'John',
        age: 30,
        // __cache: {}   // State has not been initialized with cached data
      });
      const cache = new StateCache(stateWithNoCache);

      const value = await cache.get('someKey');

      expect(value).toBeUndefined();
    });

    it('returns undefined if the cache is initialized but the key is not present', async () => {
      const stateWithCache = new InMemoryState({
        name: 'John',
        age: 30,
        __cache: {
          someKey: 'someValue',
        },
      });
      const cache = new StateCache(stateWithCache);

      const value = await cache.get('someOtherKey');

      expect(value).toBeUndefined();
    });

    it('returns the cached value if the cache is initialized', async () => {
      const stateWithCache = new InMemoryState({
        name: 'John',
        age: 30,
        __cache: {
          someKey: 'someValue',
        },
      });
      const cache = new StateCache(stateWithCache);

      const value = await cache.get('someKey');

      expect(value).toBe('someValue');
    });
  });
});
