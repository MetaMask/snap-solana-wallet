/* eslint-disable jsdoc/match-description */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-globals */
import {
  exportKeyPolyfill,
  generateKeyPolyfill,
  importKeyPolyfill,
  isPolyfilledKey,
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
export function install() {
  const { subtle } = globalThis.crypto;

  /**
   * Store the original methods
   */

  Object.defineProperty(globalThis, 'isSecureContext', {
    value: true,
    writable: true,
    configurable: true,
  });

  /**
   * Override `SubtleCrypto#exportKey`
   */
  const originalExportKey = subtle?.exportKey?.bind(subtle);
  Object.defineProperty(subtle, 'exportKey', {
    value: async (...args: Parameters<SubtleCrypto['exportKey']>) => {
      const [_, key] = args;
      if (isPolyfilledKey(key)) {
        return await exportKeyPolyfill(...args);
      }
      return await originalExportKey(...args);
    },
    writable: true,
    configurable: true,
  });

  /**
   * Override `SubtleCrypto#generateKey`
   */
  const originalGenerateKey = subtle?.generateKey?.bind(subtle);
  Object.defineProperty(subtle, 'generateKey', {
    value: async (...args: Parameters<SubtleCrypto['generateKey']>) => {
      const [algorithm] = args;

      if (algorithm !== 'Ed25519') {
        return await originalGenerateKey(...args);
      }

      const [_, extractable, keyUsages] = args;
      return generateKeyPolyfill(extractable, keyUsages);
    },
    writable: true,
    configurable: true,
  });

  /**
   * Override `SubtleCrypto#sign`
   */
  const originalSign = subtle?.sign?.bind(subtle);
  Object.defineProperty(subtle, 'sign', {
    value: async (...args: Parameters<SubtleCrypto['sign']>) => {
      const [_, key] = args;
      if (isPolyfilledKey(key)) {
        const [_, ...rest] = args;
        return await signPolyfill(...rest);
      }
      return await originalSign(...args);
    },
    writable: true,
    configurable: true,
  });

  /**
   * Override `SubtleCrypto#verify`
   */
  const originalVerify = subtle?.verify?.bind(subtle);
  Object.defineProperty(subtle, 'verify', {
    value: async (...args: Parameters<SubtleCrypto['verify']>) => {
      const [_, key] = args;
      if (isPolyfilledKey(key)) {
        const [_, ...rest] = args;
        return await verifyPolyfill(...rest);
      }
      return await originalVerify(...args);
    },
    writable: true,
    configurable: true,
  });

  /**
   * Override `SubtleCrypto#importKey`
   */
  const originalImportKey = subtle?.importKey?.bind(subtle);
  Object.defineProperty(subtle, 'importKey', {
    value: async (...args: Parameters<SubtleCrypto['importKey']>) => {
      const [format, keyData, algorithm, extractable, keyUsages] = args;

      if (algorithm !== 'Ed25519') {
        return originalImportKey(...args);
      }

      return importKeyPolyfill(format, keyData, extractable, keyUsages);
    },
    writable: true,
    configurable: true,
  });
}
