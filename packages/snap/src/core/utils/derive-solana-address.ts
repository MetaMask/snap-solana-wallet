import { SLIP10Node } from '@metamask/key-tree';
import type { SLIP10PathNode } from '@metamask/key-tree';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

import { getBip32Deriver } from '../utils/get-bip32-deriver';
import logger from '../utils/logger';

/**
 * Derivations path constant
 *
 * m - stands for Master. See: https://learnmeabitcoin.com/technical/keys/hd-wallets/derivation-paths/
 * 44' - stands for BIP44. See: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 * 501' - stands for Solana. See: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 */
const derivationPath = [`m`, `44'`, `501'`];

/**
 * Elliptic curve
 *
 * See: https://cryptography.io/en/latest/hazmat/primitives/asymmetric/ed25519/
 */
const curve = 'ed25519' as const;

export async function deriveSolanaAddress(index: number): Promise<string> {
  logger.log({ index }, 'Generating solana wallet');

  /**
   * Derivation path for Solana addresses matching Phantom
   * https://help.phantom.app/hc/en-us/articles/12988493966227-What-derivation-paths-does-Phantom-wallet-support
   * They already match our derivation path for Ethereum addresses.
   * Other wallets might follow a different logic
   */
  const hdPath = [`${index}'`, `0'`];

  try {
    const rootNode = await getBip32Deriver(derivationPath, curve);

    logger.log({ rootNode });

    const node = await SLIP10Node.fromJSON(rootNode);

    logger.log({ node });

    const slip10Path: SLIP10PathNode[] = hdPath.map(
      (segment: string) => `slip10:${segment}` as SLIP10PathNode,
    );

    logger.log({ slip10Path });

    const slipNode = await node.derive(slip10Path);

    logger.log({ slipNode });

    if (!slipNode.privateKeyBytes) {
      throw new Error('Unable to derive private key');
    }

    const keypair = nacl.sign.keyPair.fromSeed(
      Uint8Array.from(slipNode.privateKeyBytes),
    );

    logger.log({ keypair }, 'New keypair generated');

    const pubkey = bs58.encode(keypair.publicKey);

    logger.log({ pubkey }, 'Encoded public key');

    return pubkey;
  } catch (error: any) {
    logger.error({ error }, 'Error deriving address');
    throw new Error(error);
  }
}
