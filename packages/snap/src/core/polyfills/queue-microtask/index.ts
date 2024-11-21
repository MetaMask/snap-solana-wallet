const queueMicrotask = async (callback: () => void) =>
  Promise.resolve().then(callback);

/**
 * Adds support for the window#queueMicrotask() function.
 */
export function install() {
  Object.defineProperty(globalThis, 'queueMicrotask', {
    value: queueMicrotask,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}
