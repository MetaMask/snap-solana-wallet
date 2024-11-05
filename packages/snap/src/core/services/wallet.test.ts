import bs58 from 'bs58';
import nacl from 'tweetnacl';

import { getBip32Deriver } from '../utils/get-bip32-deriver';
import logger from '../utils/logger';
import { SolanaWallet } from './wallet';

jest.mock('../utils/get-bip32-deriver');
jest.mock('tweetnacl');
jest.mock('bs58');
jest.mock('../utils/logger');

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
        derive: jest.fn().mockResolvedValue({
          privateKeyBytes: new Uint8Array(32),
        }),
      };
      const mockKeyPair = {
        publicKey: new Uint8Array(32),
      };
      const mockPubKey = 'mockPubKey';

      (getBip32Deriver as jest.Mock).mockResolvedValue(mockRootNode);
      (nacl.sign.keyPair.fromSeed as jest.Mock).mockReturnValue(mockKeyPair);
      (bs58.encode as jest.Mock).mockReturnValue(mockPubKey);

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
      expect(address).toBe(mockPubKey);
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
