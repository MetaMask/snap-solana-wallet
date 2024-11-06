import bs58 from 'bs58';
import nacl from 'tweetnacl';

import { SOLANA_ADDRESS } from '../constants/address';
import { getBip32Deriver } from '../utils/get-bip32-deriver';
import logger from '../utils/logger';
import { SolanaWallet } from './wallet';

jest.mock('../utils/get-bip32-deriver');
jest.mock('tweetnacl');
jest.mock('bs58');

describe('SolanaWallet', () => {
  let solanaWallet: SolanaWallet;

  beforeEach(() => {
    solanaWallet = new SolanaWallet();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.skip('deriveAddress', () => {
    it('derive address correctly', async () => {
      const mockRootNode = { privateKeyBytes: new Uint8Array(32) };
      const mockNode = {
        derive: jest.fn().mockResolvedValue(mockRootNode),
      };
      const mockKeyPair = {
        publicKey: new Uint8Array(32),
      };

      (getBip32Deriver as jest.Mock).mockResolvedValue({
        depth: 2,
        masterFingerprint: 1723396576,
        parentFingerprint: 928701727,
        index: 2147484149,
        curve: 'ed25519',
        privateKey:
          '0x26ef23367c560d4860de025029ea7b110c66a840e273c29c18ecafd4a9f4b0dc',
        publicKey:
          '0x0026077be93a60c6c54ffdc5d463b752679d57be4a5693324424f147c5b15af8f5',
        chainCode:
          '0x5bcdaa4c9c99f90f19950d423d4169ca6d6ccc9080be74f8700e522eda66bdd7',
      });

      (nacl.sign.keyPair.fromSeed as jest.Mock).mockReturnValue(mockKeyPair);
      (bs58.encode as jest.Mock).mockReturnValue(SOLANA_ADDRESS);

      const index = 0;
      const address = await solanaWallet.deriveAddress(index);

      expect(getBip32Deriver).toHaveBeenCalledWith(
        ['m', "44'", "501'"],
        'ed25519',
      );
      expect(mockNode.derive).toHaveBeenCalledWith(["slip10:0'", "slip10:0'"]);
      expect(nacl.sign.keyPair.fromSeed).toHaveBeenCalledWith(
        Uint8Array.from(mockRootNode.privateKeyBytes),
      );
      expect(bs58.encode).toHaveBeenCalledWith(mockKeyPair.publicKey);
      expect(address).toBe(SOLANA_ADDRESS);
    });

    it('throws an error if unable to derive private key', async () => {
      const mockRootNode = { privateKeyBytes: new Uint8Array(32).fill(1) };

      (getBip32Deriver as jest.Mock).mockResolvedValue(mockRootNode);

      await expect(solanaWallet.deriveAddress(0)).rejects.toThrow(
        'Unable to derive private key',
      );
    });

    it('logs an error if derivation fails', async () => {
      const mockError = new Error('Error: Derivation failed');

      (getBip32Deriver as jest.Mock).mockRejectedValue(mockError);

      await expect(solanaWallet.deriveAddress(0)).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith(
        { error: mockError },
        'Error deriving address',
      );
    });
  });
});
