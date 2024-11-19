import * as ed from '@noble/ed25519';

import { bufferSourceAsUint8Array } from './utils/buffer-source-as-uint8-array';
import { uint8ArrayAsBufferSource } from './utils/uint8-array-as-buffer-source';

const slot = '8d9df0f7-1363-4d2c-8152-ce4ed78f27d8';

interface Ed25519CryptoKey extends CryptoKey {
  [slot]: Uint8Array;
}

const ED25519_PKCS8_HEADER = [
  0x30,
  0x2e, // SEQUENCE + length
  0x02,
  0x01,
  0x00, // INTEGER + length + version
  0x30,
  0x05,
  0x06,
  0x03,
  0x2b,
  0x65,
  0x70, // Algorithm identifier
  0x04,
  0x22,
  0x04,
  0x20, // OCTET STRING wrappers
];

/**
 * Convert a Uint8Array to a base64 string with URL-safe characters
 *
 * @param input - The Uint8Array to convert
 * @returns The base64 string with URL-safe characters
 */
export function toBase64(input: Uint8Array) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Convert a base64 string with URL-safe characters to a Uint8Array
 *
 * @param b64u - The base64 string with URL-safe characters
 * @returns The Uint8Array
 */
export function toBuffer(b64u: string) {
  const a = b64u.replace(/-/g, '+').replace(/_/g, '/');
  const b = new Uint8Array(Buffer.from(a, 'base64'));

  return b;
}

export async function exportKey(format: KeyFormat, key: CryptoKey) {
  if (!key.extractable) {
    throw new DOMException('key is not extractable', 'InvalidAccessException');
  }

  const raw = (key as Ed25519CryptoKey)[slot];

  switch (format) {
    case 'raw': {
      if (key.type !== 'public') {
        throw new DOMException(
          'Unable to export a raw Ed25519 private key',
          'InvalidAccessError',
        );
      }
      return raw.buffer;
    }
    case 'pkcs8': {
      if (key.type !== 'private') {
        throw new DOMException(
          'Unable to export a pkcs8 Ed25519 public key',
          'InvalidAccessError',
        );
      }
      return new Uint8Array([...ED25519_PKCS8_HEADER, ...raw]).buffer;
    }
    case 'jwk': {
      const base = {
        crv: 'Ed25519',
        ext: key.extractable,
        key_ops: key.usages,
        kty: 'OKP',
      };

      if (key.type === 'private') {
        const publicKey = await ed.getPublicKeyAsync(raw);
        return Object.freeze({
          ...base,
          d: toBase64(raw),
          x: toBase64(publicKey),
        });
      }

      return Object.freeze({
        ...base,
        x: toBase64(raw),
      });
    }
    case 'spki': {
      if (key.type !== 'public') {
        throw new DOMException(
          'Only public keys can be exported as SPKI',
          'InvalidAccessError',
        );
      }
      const algorithmIdentifier = new Uint8Array([
        0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70,
      ]);
      const bitString = new Uint8Array([0x03, raw.length + 1, 0x00, ...raw]);
      const sequence = new Uint8Array([
        0x30,
        algorithmIdentifier.length + bitString.length,
        ...algorithmIdentifier,
        ...bitString,
      ]);
      return sequence.buffer;
    }
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

export async function generateKey(
  _algorithm: AlgorithmIdentifier | KeyAlgorithm,
  extractable: boolean,
  keyUsages: KeyUsage[],
): Promise<CryptoKeyPair> {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  const usages = Array.from(keyUsages);

  const privateKeyObject: Ed25519CryptoKey = {
    algorithm: { name: 'Ed25519' },
    extractable,
    type: 'private',
    usages,
    [slot]: privateKey,
  };

  const publicKeyObject: Ed25519CryptoKey = {
    algorithm: { name: 'Ed25519' },
    extractable: true,
    type: 'public',
    usages,
    [slot]: publicKey,
  };

  return { privateKey: privateKeyObject, publicKey: publicKeyObject };
}

export function importKey(
  format: KeyFormat,
  keyData: BufferSource | JsonWebKey,
  _algorithm: AlgorithmIdentifier | KeyAlgorithm,
  extractable: boolean,
  keyUsages: KeyUsage[],
) {
  const usages = Array.from(keyUsages);

  switch (format) {
    case 'raw': {
      const bytes = bufferSourceAsUint8Array(keyData as BufferSource);
      if (bytes.length !== 32) {
        throw new DOMException(
          'Ed25519 raw keys must be exactly 32-bytes',
          'DataError',
        );
      }

      return {
        algorithm: { name: 'Ed25519' },
        extractable,
        type: 'public',
        usages: usages.filter((usage) => usage === 'verify'),
        [slot]: bytes,
      } as Ed25519CryptoKey;
    }
    case 'pkcs8': {
      const bytes = bufferSourceAsUint8Array(keyData as BufferSource);
      if (bytes.length !== 48) {
        // 16-byte header + 32-byte key
        throw new DOMException('Invalid PKCS8 key data length', 'DataError');
      }

      const header = bytes.slice(0, 16);
      if (!header.every((val, i) => val === ED25519_PKCS8_HEADER[i])) {
        throw new DOMException('Invalid PKCS8 header', 'DataError');
      }

      return {
        algorithm: { name: 'Ed25519' },
        extractable,
        type: 'private',
        usages: usages.filter((usage) => usage === 'sign'),
        [slot]: bytes.slice(16),
      } as Ed25519CryptoKey;
    }
    case 'jwk': {
      const jwk = keyData as JsonWebKey;
      if (jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519') {
        throw new DOMException('Invalid Ed25519 JWK', 'DataError');
      }

      const type = 'd' in jwk ? 'private' : 'public';

      if (type === 'public' && !jwk.x) {
        throw new DOMException(
          'Ed25519 JWK is missing public key',
          'DataError',
        );
      }
      if (type === 'private' && (!jwk.d || !jwk.x)) {
        throw new DOMException('Ed25519 JWK is missing key data', 'DataError');
      }

      return {
        algorithm: { name: 'Ed25519' },
        extractable,
        type,
        usages: usages.filter((usage) =>
          type === 'private' ? usage === 'sign' : usage === 'verify',
        ),
        [slot]: type === 'private' ? toBuffer(jwk.d!) : toBuffer(jwk.x!),
      } as Ed25519CryptoKey;
    }
    case 'spki': {
      const data = bufferSourceAsUint8Array(keyData as BufferSource);

      if (data[0] !== 0x30) {
        throw new DOMException('Invalid SPKI format', 'DataError');
      }

      const algorithmStart = 2;
      if (
        data[algorithmStart] !== 0x30 ||
        data[algorithmStart + 2] !== 0x06 ||
        data[algorithmStart + 3] !== 0x03 ||
        data[algorithmStart + 4] !== 0x2b ||
        data[algorithmStart + 5] !== 0x65 ||
        data[algorithmStart + 6] !== 0x70
      ) {
        throw new DOMException('Not an Ed25519 key', 'DataError');
      }

      const keyStart = algorithmStart + 7 + 2;
      return {
        algorithm: { name: 'Ed25519' },
        extractable: true,
        type: 'public',
        usages: usages.filter((usage) => usage === 'verify'),
        [slot]: data.slice(keyStart),
      } as Ed25519CryptoKey;
    }
    default:
      throw new Error(`Unsupported import format: ${format}`);
  }
}

export async function sign(
  _algorithm: AlgorithmIdentifier,
  key: CryptoKey,
  data: BufferSource,
): Promise<BufferSource> {
  if (key.type !== 'private') {
    throw new DOMException('Key is not private', 'NotAllowedError');
  }

  if (!key.usages.includes('sign')) {
    throw new DOMException('Key usage not allowed', 'NotAllowedError');
  }

  const message = bufferSourceAsUint8Array(data);
  const privateKey = (key as Ed25519CryptoKey)[slot];
  const signature = await ed.signAsync(message, privateKey);
  const signatureAsBufferSource = uint8ArrayAsBufferSource(signature);

  return signatureAsBufferSource;
}

export async function verify(
  _algorithm: AlgorithmIdentifier,
  key: CryptoKey,
  signature: BufferSource,
  data: BufferSource,
): Promise<boolean> {
  if (key.type !== 'public') {
    throw new DOMException('Key is not public', 'NotAllowedError');
  }

  if (!key.usages.includes('verify')) {
    throw new DOMException('Key usage not allowed', 'NotAllowedError');
  }

  const signatureAsUint8Array = bufferSourceAsUint8Array(signature);
  const message = bufferSourceAsUint8Array(data);
  const privateKey = (key as Ed25519CryptoKey)[slot];
  const verified = await ed.verifyAsync(
    signatureAsUint8Array,
    message,
    privateKey,
  );

  return verified;
}
