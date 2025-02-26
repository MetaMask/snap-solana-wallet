type CancellablePromise<ReturnType> = Promise<ReturnType> & {
  cancel: () => void;
};

export class CancellationError extends Error {
  constructor() {
    super('Operation cancelled');
    this.name = 'CancellationError';
  }
}

/**
 * Decorator that makes a promise cancellable.
 * @param fn - The function to wrap.
 * @returns A cancellable promise.
 */
export const withCancellable = <ReturnType>(
  fn: (...args: any[]) => Promise<ReturnType>,
): ((...args: any[]) => CancellablePromise<ReturnType>) => {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return (...args) => {
    const abortController = new AbortController();

    const promise = Promise.race([
      fn(...args),
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
 * Wraps a cancellable promise to prevent concurrent executions.
 * @param fn - The function to wrap.
 * @returns A cancellable promise.
 */
export function withoutConcurrency<
  FunctionType extends (...args: any[]) => CancellablePromise<any>,
>(fn: FunctionType): FunctionType {
  let currentTask: CancellablePromise<any> | null = null;

  return (async (...args: Parameters<FunctionType>) => {
    if (currentTask) {
      if (typeof currentTask.cancel === 'function') {
        const message = 'Cancelling previous task';
        console.warn(message);
        currentTask.cancel();
      }
    }

    const newTask: CancellablePromise<any> = fn(...args);
    currentTask = newTask;

    try {
      return await newTask;
    } finally {
      if (currentTask === newTask) {
        currentTask = null;
      }
    }
  }) as FunctionType;
}
