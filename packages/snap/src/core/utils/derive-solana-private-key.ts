import type { SLIP10PathNode } from '@metamask/key-tree';
import { SLIP10Node } from '@metamask/key-tree';

import { getBip32Entropy } from './get-bip32-entropy';
import logger from './logger';

/**
 * Derivations path constant
 *
 * m - stands for Master. See: https://learnmeabitcoin.com/technical/keys/hd-wallets/derivation-paths/
 * 44' - stands for BIP44. See: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 * 501' - stands for Solana. See: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 */
const DERIVATION_PATH = [`m`, `44'`, `501'`];

/**
 * Elliptic curve
 *
 * See: https://cryptography.io/en/latest/hazmat/primitives/asymmetric/ed25519/
 */
const CURVE = 'ed25519' as const;

/**
 * Derives a Solana private key from a given index using BIP44 derivation path.
 * The derivation path follows Phantom wallet's standard: m/44'/501'/index'/0'.
 *
 * @param index - The account index to derive. Must be a non-negative integer.
 * @returns A Promise that resolves to a Uint8Array of the private key.
 * @throws {Error} If unable to derive private key or if derivation fails.
 * @example
 * ```typescript
 * const privateKey = await deriveSolanaPrivateKey(0);
 * ```
 * @see {@link https://help.phantom.app/hc/en-us/articles/12988493966227-What-derivation-paths-does-Phantom-wallet-support} Phantom wallet derivation paths
 * @see {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki} BIP44 specification
 * @see {@link https://github.com/satoshilabs/slips/blob/master/slip-0044.md} SLIP-0044 for coin types.
 */
export async function deriveSolanaPrivateKey(
  index: number,
): Promise<Uint8Array> {
  logger.log({ index }, 'Generating solana wallet');

  /**
   * Derivation path for Solana addresses matching Phantom
   * https://help.phantom.app/hc/en-us/articles/12988493966227-What-derivation-paths-does-Phantom-wallet-support
   * They already match our derivation path for Ethereum addresses.
   * Other wallets might follow a different logic
   */
  const hdPath = [`${index}'`, `0'`];

  try {
    const rootNode = await getBip32Entropy(DERIVATION_PATH, CURVE);

    logger.log({ rootNode });

    const node = await SLIP10Node.fromJSON(rootNode);

    logger.log({ node });

    const slip10Path: SLIP10PathNode[] = hdPath.map(
      (segment: string) => `slip10:${segment}` as SLIP10PathNode,
    );

    logger.log({ slip10Path });

    const slipNode = await node.derive(slip10Path);

    logger.log({ slipNode });

    const { privateKeyBytes } = slipNode;

    if (!privateKeyBytes) {
      throw new Error('Unable to derive private key');
    }

    return privateKeyBytes;
  } catch (error: any) {
    logger.error({ error }, 'Error deriving keypair');
    throw new Error(error);
  }
}
