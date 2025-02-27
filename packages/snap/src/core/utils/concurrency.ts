export type CancellablePromise<ReturnType> = Promise<ReturnType> & {
  cancel: () => void;
};

export class CancellationError extends Error {
  constructor(message = 'Operation cancelled') {
    super(message);
    this.name = 'CancellationError';
  }
}

/**
 * Wraps a promise-returning function to make it cancellable.
 *
 * WARNING: Only the decorated function will be cancelled, not the original function.
 * However, the AbortSignal is passed down to the original function, so it can use the signal to cancel its own operations.
 *
 * @example
 * const processData = async (id: string) => {
 *   await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
 *   return { id, result: `Processed ${id}` };
 * };
 *
 * const cancellableProcessData = withCancellable(processData);
 * cancellableProcessData('123');
 * cancellableProcessData.cancel(); // This will cancel the previous process for '123'
 * @example
 * const fetchData = async (url: string, signal?: AbortSignal) => {
 *   const response = await fetch(url, { signal });
 *   return response.json();
 * };
 *
 * const cancellableFetch = withCancellable(fetchData);
 * const promise = cancellableFetch('https://api.example.com/data');
 * promise.cancel(); // This will abort the fetch request
 * @param fn - The function to make cancellable.
 * @returns A cancellable promise.
 */
export const withCancellable = <ReturnType>(
  fn: (...args: any[]) => Promise<ReturnType>,
): ((...args: any[]) => CancellablePromise<ReturnType>) => {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return (...args) => {
    const abortController = new AbortController();

    // Pass the AbortController's signal to the original function
    // We'll add the signal as the last argument if it's not already provided
    const argsWithSignal = [...args];
    if (!argsWithSignal.some((arg) => arg instanceof AbortSignal)) {
      argsWithSignal.push(abortController.signal);
    }

    const promise = Promise.race([
      fn(...argsWithSignal),
      new Promise<ReturnType>((_, reject) => {
        abortController.signal.addEventListener('abort', () => {
          reject(new CancellationError());
        });
      }),
    ]) as CancellablePromise<ReturnType>;

    promise.cancel = () => abortController.abort();
    return promise;
  };
};

/**
 * Wraps a promise-returning function to prevent concurrent executions.
 * Automatically converts the promise to a cancellable promise internally.
 *
 * @example
 * const processData = async (id: string) => {
 *   await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
 *   return { id, result: `Processed ${id}` };
 * };
 *
 * const nonConcurrentProcessData = withoutConcurrency(processData);
 *
 * // Only the latest call will complete, previous calls are cancelled
 * nonConcurrentProcessData('123');
 * nonConcurrentProcessData('456'); // This will cancel the previous process for '123'
 * @param fn - The function to wrap.
 * @returns A cancellable promise.
 */
export function withoutConcurrency<ReturnType>(
  fn: (...args: any[]) => Promise<ReturnType>,
): (...args: any[]) => Promise<ReturnType> {
  // Convert the function to return a cancellable promise
  const cancellableFn = withCancellable(fn);

  let currentTask: CancellablePromise<any> | null = null;

  return async (...args: any[]) => {
    if (currentTask) {
      if (typeof currentTask.cancel === 'function') {
        const message = 'Cancelling previous task';
        console.warn(message);
        currentTask.cancel();
      }
    }

    const newTask: CancellablePromise<ReturnType> = cancellableFn(...args);
    currentTask = newTask;

    try {
      return await newTask;
    } finally {
      if (currentTask === newTask) {
        currentTask = null;
      }
    }
  };
}
