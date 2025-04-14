import type { Serializable } from '../serialization/types';
import type { ICache } from './ICache';
import { useCache, type CacheOptions } from './useCache';

describe('useCache', () => {
  // Spy to check if the original function was executed or not
  let actualExecutionSpy: jest.Mock;

  // Mock cache
  let cache: ICache<Serializable>;

  // Common cache options
  let cacheOptions: CacheOptions;

  // Original test functions
  let testFunction: () => Promise<string>;
  let testFunctionWithArgs: (arg1: string, arg2: number) => Promise<string>;
  let testFunctionWithComplexArgs: (obj: {
    name: string;
    age: number;
  }) => Promise<string>;

  // Cached versions
  let cachedTestFunction: () => Promise<string>;
  let cachedTestFunctionWithArgs: (
    arg1: string,
    arg2: number,
  ) => Promise<string>;
  let cachedTestFunctionWithComplexArgs: (obj: {
    name: string;
    age: number;
  }) => Promise<string>;

  beforeEach(() => {
    // Reset mocks for each test
    actualExecutionSpy = jest.fn().mockResolvedValue('test');

    // Create a mock cache
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    } as unknown as ICache<Serializable>;

    // Define common cache options
    cacheOptions = {
      ttlMilliseconds: 1000,
      functionName: 'testFunction',
    };

    // Define original functions
    testFunction = async () => actualExecutionSpy();
    testFunctionWithArgs = async (arg1: string, arg2: number) =>
      actualExecutionSpy(arg1, arg2);
    testFunctionWithComplexArgs = async (obj: { name: string; age: number }) =>
      actualExecutionSpy(obj);

    // Create cached versions
    cachedTestFunction = useCache(testFunction, cache, {
      ...cacheOptions,
      functionName: 'testFunction',
    });

    cachedTestFunctionWithArgs = useCache(testFunctionWithArgs, cache, {
      ...cacheOptions,
      functionName: 'testFunctionWithArgs',
    });

    cachedTestFunctionWithComplexArgs = useCache(
      testFunctionWithComplexArgs,
      cache,
      {
        ...cacheOptions,
        functionName: 'testFunctionWithComplexArgs',
      },
    );
  });

  describe('when the data is not cached', () => {
    it('should cache the result of a function', async () => {
      // No cached data
      jest.spyOn(cache, 'get').mockResolvedValue(undefined);

      const result = await cachedTestFunction();

      expect(result).toBe('test');
      expect(cache.get).toHaveBeenCalledTimes(1);
      expect(actualExecutionSpy).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith('testFunction:', 'test', 1000);
    });
  });

  describe('when the data is cached', () => {
    it('should return the cached result', async () => {
      // Init the cache with some data
      jest.spyOn(cache, 'get').mockResolvedValue('test');

      const result = await cachedTestFunction();

      expect(result).toBe('test');
      expect(cache.get).toHaveBeenCalledTimes(1);
      expect(actualExecutionSpy).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should propagate errors from the original function', async () => {
      const error = new Error('Test error');
      actualExecutionSpy.mockRejectedValueOnce(error);

      await expect(cachedTestFunction()).rejects.toThrow('Test error');
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('should handle cache get errors gracefully', async () => {
      jest.spyOn(cache, 'get').mockRejectedValueOnce(new Error('Cache error'));
      actualExecutionSpy.mockResolvedValueOnce('test');

      const result = await cachedTestFunction();

      expect(result).toBe('test');
      expect(actualExecutionSpy).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith('testFunction:', 'test', 1000);
    });

    it('should handle cache set errors gracefully', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(undefined);
      jest
        .spyOn(cache, 'set')
        .mockRejectedValueOnce(new Error('Cache set error'));
      actualExecutionSpy.mockResolvedValueOnce('test');

      const result = await cachedTestFunction();

      expect(result).toBe('test');
      expect(actualExecutionSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('different argument types', () => {
    it('should handle primitive arguments correctly', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(undefined);
      jest.spyOn(cache, 'set').mockResolvedValueOnce(undefined);
      actualExecutionSpy.mockResolvedValueOnce('test with args');

      const result = await cachedTestFunctionWithArgs('hello', 42);

      expect(result).toBe('test with args');
      expect(cache.get).toHaveBeenCalledWith('testFunctionWithArgs:"hello":42');
      expect(actualExecutionSpy).toHaveBeenCalledWith('hello', 42);
    });

    it('should handle complex object arguments correctly', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(undefined);
      jest.spyOn(cache, 'set').mockResolvedValueOnce(undefined);
      const testObj = { name: 'John', age: 30 };
      actualExecutionSpy.mockResolvedValueOnce('test with complex args');

      const result = await cachedTestFunctionWithComplexArgs(testObj);

      expect(result).toBe('test with complex args');
      expect(cache.get).toHaveBeenCalledWith(
        'testFunctionWithComplexArgs:{"name":"John","age":30}',
      );
      expect(actualExecutionSpy).toHaveBeenCalledWith(testObj);
    });
  });

  describe('custom generateCacheKey', () => {
    it('should use a custom key generator if provided', async () => {
      const customKeyGenerator = jest.fn().mockReturnValue('custom-key');

      const customCachedFunction = useCache(testFunction, cache, {
        ...cacheOptions,
        generateCacheKey: customKeyGenerator,
      });

      await customCachedFunction();

      expect(customKeyGenerator).toHaveBeenCalledTimes(1);
      expect(cache.get).toHaveBeenCalledWith('custom-key');
    });
  });

  describe('anonymous functions', () => {
    it('should handle anonymous functions with a default name', async () => {
      // Anonymous function with no name
      const anonymousFunction = async () => actualExecutionSpy();
      Object.defineProperty(anonymousFunction, 'name', { value: null });

      const cachedAnonymousFunction = useCache(anonymousFunction, cache, {
        ttlMilliseconds: 1000,
      });

      await cachedAnonymousFunction();

      expect(cache.get).toHaveBeenCalledWith('anonymousFunction:');
    });
  });

  describe('function name override', () => {
    it('should use the provided function name if given', async () => {
      const cachedWithCustomName = useCache(testFunction, cache, {
        ttlMilliseconds: 1000,
        functionName: 'customFunctionName',
      });

      await cachedWithCustomName();

      expect(cache.get).toHaveBeenCalledWith('customFunctionName:');
    });
  });

  describe('falsy but valid cache values', () => {
    it('should handle falsy but valid cache values (false, 0, empty string)', async () => {
      // Test with false
      jest.spyOn(cache, 'get').mockResolvedValue(false);
      let result = await cachedTestFunction();
      expect(result).toBe(false);
      expect(actualExecutionSpy).not.toHaveBeenCalled();

      // Test with 0
      jest.spyOn(cache, 'get').mockResolvedValue(0);
      result = await cachedTestFunction();
      expect(result).toBe(0);
      expect(actualExecutionSpy).not.toHaveBeenCalled();

      // Test with empty string
      jest.spyOn(cache, 'get').mockResolvedValue('');
      result = await cachedTestFunction();
      expect(result).toBe('');
      expect(actualExecutionSpy).not.toHaveBeenCalled();
    });

    it('should execute the function when cache returns undefined', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(undefined);
      actualExecutionSpy.mockResolvedValueOnce('test');

      const result = await cachedTestFunction();

      expect(result).toBe('test');
      expect(actualExecutionSpy).toHaveBeenCalledTimes(1);
    });
  });
});
