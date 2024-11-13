import { SLIP10Node } from '@metamask/key-tree';
import { Keypair } from '@solana/web3.js';
import { getBip32Entropy } from './get-bip32-entropy';
import { deriveSolanaKeypair } from './derive-solana-keypair';

// Mock the external dependencies
jest.mock('./get-bip32-entropy');
jest.mock('@metamask/key-tree');
jest.mock('./logger');

describe('deriveSolanaKeypair', () => {
  const mockRootNode = {
    depth: 2,
    masterFingerprint: 3974444335,
    parentFingerprint: 2046425034,
    index: 2147484149,
    curve: 'ed25519',
    privateKey:
      '0x7acf6060833428c2196ce6e2c5ba5455394602814b9ec6b9bac453b357be7b24',
    publicKey:
      '0x00389ed03449fbc42a3ec134609b664a50e7a78bad800bad1629113590bfc9af9b',
    chainCode:
      '0x99d7cef35ae591a92eab31e0007f0199e3bea62d211a219526bf2ae06799886d',
  };

  const mockPrivateKeyBytes = new Uint8Array([1, 2, 3, 4]); // Example private key bytes

  beforeEach(() => {
    jest.clearAllMocks();
    (getBip32Entropy as jest.Mock).mockResolvedValue(mockRootNode);

    // Mock SLIP10Node implementation
    const mockSlipNode = {
      derive: jest.fn().mockResolvedValue({
        privateKeyBytes: mockPrivateKeyBytes,
      }),
    };
    (SLIP10Node.fromJSON as jest.Mock).mockResolvedValue(mockSlipNode);
  });

  it('should successfully derive a Solana keypair', async () => {
    const keypairSpy = jest.spyOn(Keypair, 'fromSecretKey');

    await deriveSolanaKeypair(0);

    // Verify getBip32Entropy was called with correct parameters
    expect(getBip32Entropy).toHaveBeenCalledWith(
      ['m', `44'`, `501'`],
      'ed25519',
    );

    // Verify SLIP10Node.fromJSON was called with root node
    expect(SLIP10Node.fromJSON).toHaveBeenCalledWith(mockRootNode);

    // Verify derive was called with correct path
    const mockNode = await SLIP10Node.fromJSON(mockRootNode);
    expect(mockNode.derive).toHaveBeenCalledWith(["slip10:0'", "slip10:0'"]);

    // Verify Keypair creation
    expect(keypairSpy).toHaveBeenCalledWith(mockPrivateKeyBytes);
  });

  it('should throw error if unable to derive private key', async () => {
    // Mock SLIP10Node to return node without privateKeyBytes
    const mockSlipNode = {
      derive: jest.fn().mockResolvedValue({
        privateKeyBytes: null,
      }),
    };
    (SLIP10Node.fromJSON as jest.Mock).mockResolvedValue(mockSlipNode);

    await expect(deriveSolanaKeypair(0)).rejects.toThrow(
      'Unable to derive private key',
    );
  });

  it('should throw error if getBip32Entropy fails', async () => {
    const errorMessage = 'Failed to get entropy';
    (getBip32Entropy as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(deriveSolanaKeypair(0)).rejects.toThrow(errorMessage);
  });

  it('should throw error if SLIP10Node.fromJSON fails', async () => {
    const errorMessage = 'Failed to create node';
    (SLIP10Node.fromJSON as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    await expect(deriveSolanaKeypair(0)).rejects.toThrow(errorMessage);
  });

  it('should derive different keypairs for different indices', async () => {
    const keypairSpy = jest.spyOn(Keypair, 'fromSecretKey');

    await deriveSolanaKeypair(0);
    await deriveSolanaKeypair(1);

    const mockNode = await SLIP10Node.fromJSON(mockRootNode);

    // Verify derive was called with different paths
    expect(mockNode.derive).toHaveBeenCalledWith(["slip10:0'", "slip10:0'"]);
    expect(mockNode.derive).toHaveBeenCalledWith(["slip10:1'", "slip10:0'"]);
  });
});
