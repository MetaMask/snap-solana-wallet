import type { SLIP10Node } from '@metamask/key-tree';
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

/**
 * Derives a Solana keypair from a pre-computed coin-type node (m/44'/501'),
 * avoiding a snap_getBip32Entropy call per account.
 *
 * @param params - The parameters for key derivation.
 * @param params.coinTypeNode - The SLIP10 node at m/44'/501'.
 * @param params.accountIndex - The BIP-44 account index to derive.
 * @returns A Promise that resolves to the private and public key bytes.
 */
export async function deriveSolanaKeypairFromCoinTypeNode({
  coinTypeNode,
  accountIndex,
}: {
  coinTypeNode: SLIP10Node;
  accountIndex: number;
}): Promise<{ privateKeyBytes: Uint8Array; publicKeyBytes: Uint8Array }> {
  // We use m/44'/501'/${accountIndex}'/0' as the derivation path. So now need to derive
  // the account index + the change index (0) from the coin type node.
  const derived = await coinTypeNode.derive([
    `slip10:${accountIndex}'`,
    `slip10:0'`,
  ]);

  if (!derived.privateKeyBytes || !derived.publicKeyBytes) {
    throw new Error('Unable to derive private key');
  }

  return {
    privateKeyBytes: derived.privateKeyBytes,
    publicKeyBytes: derived.publicKeyBytes,
  };
}
