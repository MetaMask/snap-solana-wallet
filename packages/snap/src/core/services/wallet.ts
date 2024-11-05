import { SLIP10Node } from '@metamask/key-tree';
import type { SLIP10PathNode } from '@metamask/key-tree';
import type { KeyringAccount } from '@metamask/keyring-api';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

import { getBip32Deriver } from '../utils/get-bip32-deriver';
import logger from '../utils/logger';

export type Wallet = {
  account: KeyringAccount;
  hdPath: string;
  index: number;
  scope: string;
};

/**
 * A wallet for Solana is basically the outcome of applying cryptography operations to a seed phrase, a private key.
 * We can derive addresses (multiple PublicKeys) and sign transactions using this class.
 * https://learnmeabitcoin.com/technical/keys/hd-wallets/derivation-paths/
 */
export class SolanaWallet {
  /**
   * Derivations path constant
   *
   * m - stands for Master. See: https://learnmeabitcoin.com/technical/keys/hd-wallets/derivation-paths/
   * 44' - stands for BIP44. See: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
   * 501' - stands for Solana. See: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
   */
  #derivationPath = [`m`, `44'`, `501'`];

  async deriveAddress(index: number): Promise<string> {
    logger.log({ index }, 'Generating solana wallet');

    const hdPath = [`0'`, `0'`, `${index}`];
    const rootNode = await getBip32Deriver(this.#derivationPath, 'ed25519');

    const node = await SLIP10Node.fromJSON(rootNode);

    const slip10Path: SLIP10PathNode[] = hdPath.map(
      (segment: string) => `slip10:${segment}` as SLIP10PathNode,
    );

    const slipNode = await node.derive(slip10Path);

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
  }
}
