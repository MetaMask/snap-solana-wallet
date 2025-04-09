/**
 * Replicates the behavior of [Promise.any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any).
 *
 * Takes an iterable of promises as input and returns a single Promise. This returned promise fulfills when any of the input's promises fulfills, with this first fulfillment value. It rejects when all of the input's promises reject (including when an empty iterable is passed), with an AggregateError containing an array of rejection reasons.
 *
 * @param promises - The promises to resolve.
 * @returns A promise that resolves to the first resolved promise.
 */
export const PromiseAny = async <TReturn>(
  promises: Promise<TReturn>[],
): Promise<TReturn> => {
  return new Promise<TReturn>((resolve, reject) => {
    if (promises.length === 0) {
      reject(new AggregateError([], 'No promises to resolve'));
      return;
    }

    let rejectedCount = 0;
    const errors: any[] = [];

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(
        (value: TReturn) => resolve(value),
        (error) => {
          errors[index] = error;
          rejectedCount += 1;
          if (rejectedCount === promises.length) {
            reject(new AggregateError(errors, 'All promises rejected'));
          }
        },
      );
    });
  });
};
