import type { EntropySourceId } from '@metamask/keyring-api';
import { assert } from '@metamask/superstruct';
import { hexToBytes } from '@metamask/utils';

import { DerivationPathStruct } from '../validation/structs';
import { getBip32Entropy } from './getBip32Entropy';
import logger from './logger';

/**
 * Elliptic curve
 *
 * See: https://cryptography.io/en/latest/hazmat/primitives/asymmetric/ed25519/
 */
const CURVE = 'ed25519' as const;

/**
 * Derives a Solana private and public key from a given index using BIP44 derivation path.
 * The derivation path follows Phantom wallet's standard: m/44'/501'/index'/0'.
 *
 * @param params - The parameters for the Solana key derivation.
 * @param params.entropySource - The entropy source to use for key derivation.
 * @param params.derivationPath - The derivation path to use for key derivation.
 * @returns A Promise that resolves to a Uint8Array of the private key.
 * @throws {Error} If unable to derive private key or if derivation fails.
 * @example
 * ```typescript
 * const { privateKeyBytes, publicKeyBytes } = await deriveSolanaPrivateKey(0);
 * ```
 * @see {@link https://help.phantom.app/hc/en-us/articles/12988493966227-What-derivation-paths-does-Phantom-wallet-support} Phantom wallet derivation paths
 * @see {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki} BIP44 specification
 * @see {@link https://github.com/satoshilabs/slips/blob/master/slip-0044.md} SLIP-0044 for coin types.
 */
export async function deriveSolanaKeypair({
  entropySource,
  derivationPath,
}: {
  entropySource?: EntropySourceId | undefined;
  derivationPath: string;
}): Promise<{ privateKeyBytes: Uint8Array; publicKeyBytes: Uint8Array }> {
  logger.log({ derivationPath }, 'Generating solana wallet');

  assert(derivationPath, DerivationPathStruct);

  const path = derivationPath.split('/');

  try {
    const node = await getBip32Entropy({
      entropySource,
      path,
      curve: CURVE,
    });

    if (!node.privateKey || !node.publicKey) {
      throw new Error('Unable to derive private key');
    }

    return {
      privateKeyBytes: hexToBytes(node.privateKey),
      publicKeyBytes: hexToBytes(node.publicKey),
    };
  } catch (error: any) {
    logger.error({ error }, 'Error deriving keypair');
    throw new Error(error);
  }
}
