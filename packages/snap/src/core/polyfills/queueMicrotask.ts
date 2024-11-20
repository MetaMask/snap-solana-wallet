const queueMicrotask = async (callback: () => void) =>
  Promise.resolve().then(callback);

export const installQueueMicrotask = () => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  globalThis.queueMicrotask = queueMicrotask;
};
