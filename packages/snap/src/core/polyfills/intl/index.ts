/**
 * Adds support for the Intl object's Collator#toLocaleString method.
 */
export function install() {
  class Collator {
    toLocaleString() {
      return this.toString();
    }
  }

  Object.defineProperty(globalThis, 'Intl', {
    value: {
      Collator,
    },
    writable: true,
    configurable: true,
    enumerable: true,
  });
}
