import type { Serializable } from '../serialization/types';
import type { ICache } from './ICache';
import { UseCache } from './UseCache';

describe('UseCache', () => {
  // Spy to check if the testMethod was executed or not
  let actualExecutionSpy: jest.Mock;

  // A test class that uses the UseCache decorator
  class TestClass {
    #cache: ICache<Serializable>;

    constructor(cache: ICache<Serializable>) {
      this.#cache = cache;
    }

    @UseCache({
      ttlMilliseconds: 1000,
      getCache: (instance) => instance.#cache,
    })
    async testMethod() {
      return actualExecutionSpy();
    }

    @UseCache({
      ttlMilliseconds: 1000,
      getCache: (instance) => instance.#cache,
    })
    async testMethodWithArgs(arg1: string, arg2: number) {
      return actualExecutionSpy(arg1, arg2);
    }

    @UseCache({
      ttlMilliseconds: 1000,
      getCache: (instance) => instance.#cache,
    })
    async testMethodWithComplexArgs(obj: { name: string; age: number }) {
      return actualExecutionSpy(obj);
    }
  }

  let cache: ICache<Serializable>;
  let instance: TestClass;

  beforeEach(() => {
    actualExecutionSpy = jest.fn().mockResolvedValue('test');

    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    } as unknown as ICache<Serializable>;

    instance = new TestClass(cache);
  });

  describe('when the data is not cached', () => {
    it('should cache the result of a method', async () => {
      // No cached data
      jest.spyOn(cache, 'get').mockResolvedValue(undefined);

      const result = await instance.testMethod();

      expect(result).toBe('test');
      expect(cache.get).toHaveBeenCalledTimes(1);
      expect(actualExecutionSpy).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith(
        'TestClass:testMethod:',
        'test',
        1000,
      );
    });
  });

  describe('when the data is cached', () => {
    it('should return the cached result', async () => {
      // Init the cache with some data
      jest.spyOn(cache, 'get').mockResolvedValue('test');

      const result = await instance.testMethod();

      expect(result).toBe('test');
      expect(cache.get).toHaveBeenCalledTimes(1);
      expect(actualExecutionSpy).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should propagate errors from the original method', async () => {
      const error = new Error('Test error');
      actualExecutionSpy.mockRejectedValueOnce(error);

      await expect(instance.testMethod()).rejects.toThrow('Test error');
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('should handle cache get errors gracefully', async () => {
      jest.spyOn(cache, 'get').mockRejectedValueOnce('Cache error');
      actualExecutionSpy.mockResolvedValueOnce('test');

      const result = await instance.testMethod();

      expect(result).toBe('test');
      expect(actualExecutionSpy).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith(
        'TestClass:testMethod:',
        'test',
        1000,
      );
    });

    it('should handle cache set errors gracefully', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(undefined);
      jest.spyOn(cache, 'set').mockRejectedValueOnce('Cache set error');
      actualExecutionSpy.mockResolvedValueOnce('test');

      const result = await instance.testMethod();

      expect(result).toBe('test');
      expect(actualExecutionSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('different argument types', () => {
    it('should handle primitive arguments correctly', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(undefined);
      jest.spyOn(cache, 'set').mockResolvedValueOnce(undefined);
      actualExecutionSpy.mockResolvedValueOnce('test with args');

      const result = await instance.testMethodWithArgs('hello', 42);

      expect(result).toBe('test with args');
      expect(cache.get).toHaveBeenCalledWith(
        'TestClass:testMethodWithArgs:"hello":42',
      );
      expect(actualExecutionSpy).toHaveBeenCalledWith('hello', 42);
    });

    it('should handle complex object arguments correctly', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(undefined);
      jest.spyOn(cache, 'set').mockResolvedValueOnce(undefined);
      const testObj = { name: 'John', age: 30 };
      actualExecutionSpy.mockResolvedValueOnce('test with complex args');

      const result = await instance.testMethodWithComplexArgs(testObj);

      expect(result).toBe('test with complex args');
      expect(cache.get).toHaveBeenCalledWith(
        'TestClass:testMethodWithComplexArgs:{"name":"John","age":30}',
      );
      expect(actualExecutionSpy).toHaveBeenCalledWith(testObj);
    });
  });
});
