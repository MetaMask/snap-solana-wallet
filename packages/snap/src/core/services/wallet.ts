import { getBip32Deriver } from '../utils/get-bip32-deriver';
import { SLIP10Node } from '@metamask/key-tree';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import logger from '../utils/logger'
import type { KeyringAccount } from '@metamask/keyring-api';

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
  #DERIVATION_PATH = [`m`, `44'`, `501'`]

  /**
   * If you pass an address index we need to derive all addresses from 0 to the index received
   */
  static async create({
    addressIndex = 0,
  }: {
    addressIndex?: number;
  }) {
    logger.log({}, 'Generating solana wallet')
    
    const hdPath = [`0'`, `0'`, addressIndex];

    const rootNode = await getBip32Deriver(this.#DERIVATION_PATH, 'ed25519')

    const node = await SLIP10Node.fromJSON(rootNode);
    const slipNode = await node.derive(hdPath.map((segment) => `slip10:${segment}`));

    console.log('SOLANA keypair: ' + JSON.stringify(slipNode, null, 2))

    // @ts-ignore
    const myKeypair = nacl.sign.keyPair.fromSeed(Uint8Array.from(slipNode.privateKeyBytes));
    console.log('SOLANA sign myKeypair: ' + JSON.stringify(myKeypair, null, 2))

    const pubkey = bs58.encode(myKeypair.publicKey);

    console.log('SOLANA: ' + JSON.stringify(pubkey, null, 2))

    return pubkey;
  }

  async deriveAddress(index: number) {
    
  }
}
