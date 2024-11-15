/* eslint-disable prefer-spread */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable jsdoc/match-description */
/* eslint-disable no-multi-assign */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable no-restricted-globals */
import {
  exportKeyPolyfill,
  generateKeyPolyfill,
  importKeyPolyfill,
  signPolyfill,
  verifyPolyfill,
} from './polyfill';

/**
 * Adds Ed25519 support to Web Crypto API's native methods.
 * Uses `defineProperty` to overwrite the native methods with polyfilled versions because we can't
 * overwrite the native methods directly.
 *
 * Based on: https://github.com/solana-labs/solana-web3.js/tree/master/packages/webcrypto-ed25519-polyfill
 */
export function installUnsafe() {
  Object.defineProperty(globalThis, 'isSecureContext', {
    value: true,
    writable: true,
    configurable: true,
  });

  const polyfilledSubtle = {
    ...globalThis.crypto.subtle,
    exportKey: exportKeyPolyfill,
    generateKey: generateKeyPolyfill,
    sign: signPolyfill,
    verify: verifyPolyfill,
    importKey: importKeyPolyfill,
  };

  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      subtle: polyfilledSubtle,
    },
  });
}
