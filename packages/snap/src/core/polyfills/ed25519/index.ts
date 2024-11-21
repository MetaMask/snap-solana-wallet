import {
  exportKey as exportKeyPolyfill,
  generateKey as generateKeyPolyfill,
  importKey as importKeyPolyfill,
  sign as signPolyfill,
  verify as verifyPolyfill,
} from './polyfill';
import { isEd25519Algorithm } from './utils/is-ed25519-algorithm';

/**
 * Adds Ed25519 support to Web Crypto API's native methods.
 *
 * Based on the following libraries:
 * https://github.com/solana-labs/solana-web3.js/tree/master/packages/webcrypto-ed25519-polyfill
 * https://github.com/yoursunny/webcrypto-ed25519.
 *
 */
export function install() {
  const { subtle } = globalThis.crypto;

  Object.defineProperty(globalThis, 'isSecureContext', {
    value: true,
    writable: true,
    configurable: true,
  });

  /**
   * Override `SubtleCrypto#generateKey`
   */
  Object.defineProperty(subtle, 'generateKey', {
    /* eslint-disable-next-line no-restricted-globals */
    value: async (...args: Parameters<SubtleCrypto['generateKey']>) => {
      const algorithm = args[0];

      if (!isEd25519Algorithm(algorithm)) {
        return await globalThis.crypto.subtle.generateKey(...args);
      }

      return await generateKeyPolyfill(...args);
    },
    writable: true,
    configurable: true,
  });

  /**
   * Override `SubtleCrypto#exportKey`
   */
  Object.defineProperty(subtle, 'exportKey', {
    /* eslint-disable-next-line no-restricted-globals */
    value: async (...args: Parameters<SubtleCrypto['exportKey']>) => {
      const key = args[1];

      if (!isEd25519Algorithm(key.algorithm)) {
        return await globalThis.crypto.subtle.exportKey(...args);
      }

      return await exportKeyPolyfill(...args);
    },
    writable: true,
    configurable: true,
  });

  /**
   * Override `SubtleCrypto#sign`
   */
  Object.defineProperty(subtle, 'sign', {
    /* eslint-disable-next-line no-restricted-globals */
    value: async (...args: Parameters<SubtleCrypto['sign']>) => {
      const [algorithm, key] = args;

      if (
        !isEd25519Algorithm(algorithm) ||
        !isEd25519Algorithm(key.algorithm)
      ) {
        return await globalThis.crypto.subtle.sign(...args);
      }

      return await signPolyfill(...args);
    },
    writable: true,
    configurable: true,
  });

  /**
   * Override `SubtleCrypto#verify`
   */
  Object.defineProperty(subtle, 'verify', {
    /* eslint-disable-next-line no-restricted-globals */
    value: async (...args: Parameters<SubtleCrypto['verify']>) => {
      const [algorithm, key] = args;

      if (
        !isEd25519Algorithm(algorithm) ||
        !isEd25519Algorithm(key.algorithm)
      ) {
        return await globalThis.crypto.subtle.verify(...args);
      }

      return await verifyPolyfill(...args);
    },
    writable: true,
    configurable: true,
  });

  /**
   * Override `SubtleCrypto#importKey`
   */
  Object.defineProperty(subtle, 'importKey', {
    /* eslint-disable-next-line no-restricted-globals */
    value: async (...args: Parameters<SubtleCrypto['importKey']>) => {
      const algorithm = args[2];

      if (!isEd25519Algorithm(algorithm)) {
        return await globalThis.crypto.subtle.importKey(...args);
      }

      return await importKeyPolyfill(...args);
    },
    writable: true,
    configurable: true,
  });
}
