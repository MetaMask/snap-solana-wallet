export const installIntl = () => {
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
};
