/**
 * Adds support for the DOMException object.
 */
export function install() {
  Object.defineProperty(globalThis, 'DOMException', {
    value: Error,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}
