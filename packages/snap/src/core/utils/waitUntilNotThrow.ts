/**
 * Wait until the passed function does not throw an error, retrying with a delay
 * between attempts until the maximum number of attempts is reached.
 * @param fn - The function to wait for.
 * @param options - The options for the function.
 * @param options.maxAttempts - The maximum number of attempts.
 * @param options.delayMs - The delay between attempts in milliseconds.
 * @returns The result of the function.
 */
export async function waitUntilNotThrow<TResult>(
  fn: () => Promise<TResult> | TResult,
  options?: {
    maxAttempts?: number;
    delayMs?: number;
  },
): Promise<TResult> {
  const maxAttempts = options?.maxAttempts ?? 10;
  const delayMs = options?.delayMs ?? 1000;

  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempts += 1;
      if (attempts === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Unreachable');
}
