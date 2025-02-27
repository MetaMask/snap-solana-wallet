/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { CancellablePromise } from './concurrency';
import {
  CancellationError,
  withCancellable,
  withoutConcurrency,
} from './concurrency';

describe('concurrency', () => {
  describe('withCancellable', () => {
    it('resolves normally when not cancelled', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const cancellable = withCancellable(mockFn);

      const result = await cancellable();
      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('rejects with CancellationError when cancelled', async () => {
      const mockFn = jest.fn().mockImplementation(async () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve('Hello'), 1000);
        });
      });
      const cancellable = withCancellable(mockFn);

      const promise = cancellable();
      promise.cancel();

      await expect(promise).rejects.toThrow(CancellationError);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('does not resolve after cancellation even if original promise resolves', async () => {
      // Create a manually controlled promise that we can resolve explicitly
      let resolveOriginal: (value: string) => void;
      const originalPromise = new Promise<string>((resolve) => {
        resolveOriginal = resolve;
      });

      const mockFn = jest.fn().mockReturnValue(originalPromise);
      const cancellable = withCancellable(mockFn);

      // Start the cancellable operation
      const promise = cancellable();

      // Set up a way to check if the promise resolves
      let wasResolved = false;
      promise
        .then(() => {
          wasResolved = true;
        })
        .catch(() => {
          // We expect it to be rejected with CancellationError
        });

      // Cancel it
      promise.cancel();

      // Now resolve the original promise
      resolveOriginal!('result');

      // Wait a bit to ensure any potential resolution would have happened
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify the promise was rejected, not resolved
      expect(wasResolved).toBe(false);
      await expect(promise).rejects.toThrow(CancellationError);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('supports multiple concurrent cancellable operations', async () => {
      const delays = [100, 50, 150];
      const mockFn = jest
        .fn()
        .mockImplementation(
          async (delay: number) =>
            new Promise<string>((resolve) =>
              setTimeout(() => resolve(`finished ${delay}`), delay),
            ),
        );

      const cancellable = withCancellable(mockFn);

      // Create cancellable promises directly
      // eslint-disable-next-line @typescript-eslint/promise-function-async
      const promises = delays.map((delay) =>
        cancellable(delay),
      ) as CancellablePromise<string>[];

      // Cancel first and last operations
      promises[0]!.cancel();
      promises[2]!.cancel();

      const results = await Promise.allSettled(promises);

      expect(results[0]).toMatchObject({
        status: 'rejected',
        reason: expect.any(CancellationError),
      });
      expect(results[1]).toMatchObject({
        status: 'fulfilled',
        value: 'finished 50',
      });
      expect(results[2]).toMatchObject({
        status: 'rejected',
        reason: expect.any(CancellationError),
      });
    });

    it('supports cancellation of the original function', async () => {
      // Create a mock function that simulates a long-running operation
      // and properly handles the AbortSignal
      const mockFn = jest
        .fn()
        .mockImplementation(async (_param: string, signal?: AbortSignal) => {
          // Check if already aborted
          if (signal?.aborted) {
            throw new CancellationError();
          }

          return new Promise<string>((resolve, reject) => {
            // Set up a timeout to simulate work
            const timeout = setTimeout(() => resolve('completed'), 1000);

            // Set up cancellation handler
            signal?.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new CancellationError('Operation aborted'));
            });
          });
        });

      const cancellable = withCancellable(mockFn);

      // Start the operation
      const promise = cancellable('test-param');

      // Cancel it
      promise.cancel();

      // Verify it was cancelled
      await expect(promise).rejects.toThrow(CancellationError);

      // Verify the mock function was called with the signal
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn.mock.calls[0][0]).toBe('test-param');
      expect(mockFn.mock.calls[0][1]).toBeInstanceOf(AbortSignal);

      // Verify the signal was aborted
      const passedSignal = mockFn.mock.calls[0][1] as AbortSignal;
      expect(passedSignal.aborted).toBe(true);
    });
  });

  describe('withoutConcurrency', () => {
    it('executes a task normally when there is no previous task', async () => {
      // Create a mock function that returns a regular promise
      const mockFn = jest.fn().mockResolvedValue('result');

      // Wrap with withoutConcurrency
      const nonConcurrentFn = withoutConcurrency(mockFn);

      // Execute the function
      const result = await nonConcurrentFn();

      // Verify the result
      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous task when a new task is started', async () => {
      // Create a manually controlled promise
      let resolveFirst: (value: string) => void;
      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });

      // Create a mock function that returns our controlled promise for the first call
      // and a regular resolved promise for the second call
      const mockFn = jest
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockResolvedValueOnce('second result');

      // Create non-concurrent version from the promise-returning function
      const nonConcurrentFn = withoutConcurrency(mockFn);

      // Start the first task (but don't resolve it yet)
      const firstTask = nonConcurrentFn();

      // Set up a way to check if the first task was cancelled
      let firstWasCancelled = false;
      firstTask.catch((error) => {
        if (error instanceof CancellationError) {
          firstWasCancelled = true;
        }
      });

      // Start a second task before the first one completes
      const secondResult = await nonConcurrentFn();

      // Now resolve the first task
      resolveFirst!('first result');

      // Wait a bit to ensure any potential resolution would have happened
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify the first task was cancelled and the second task completed
      expect(firstWasCancelled).toBe(true);
      expect(secondResult).toBe('second result');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('allows a new task to start after previous task completes', async () => {
      // Create a mock function
      const mockFn = jest
        .fn()
        .mockResolvedValueOnce('first result')
        .mockResolvedValueOnce('second result');

      // Create non-concurrent version
      const nonConcurrentFn = withoutConcurrency(mockFn);

      // Execute the first task and wait for it to complete
      const firstResult = await nonConcurrentFn();

      // Execute the second task
      const secondResult = await nonConcurrentFn();

      // Verify both tasks completed successfully
      expect(firstResult).toBe('first result');
      expect(secondResult).toBe('second result');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});
