export const installDOMException = () => {
  Object.defineProperty(globalThis, 'DOMException', {
    value: Error,
    writable: true,
    configurable: true,
    enumerable: true,
  });
};
