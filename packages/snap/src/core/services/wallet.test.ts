import { SolanaWallet } from './wallet';

/**
 * Test seed phrase is:
 * sugar interest animal afford dog imitate relief lizard width strategy embark midnight
 *
 * Which yields the following root node from getBip32Deriver:
 * ```json
 * {
 *   "depth": 2,
 *   "masterFingerprint": 3974444335,
 *   "parentFingerprint": 2046425034,
 *   "index": 2147484149,
 *   "curve": "ed25519",
 *   "privateKey": "0x7acf6060833428c2196ce6e2c5ba5455394602814b9ec6b9bac453b357be7b24",
 *   "publicKey": "0x00389ed03449fbc42a3ec134609b664a50e7a78bad800bad1629113590bfc9af9b",
 *   "chainCode": "0x99d7cef35ae591a92eab31e0007f0199e3bea62d211a219526bf2ae06799886d"
 * }
 * ```
 *
 * And returns the following addresses per index, using Solana's derivation path
 * `m`, `44'`, `501'`, `${index}'`, `0'`
 *
 * #0 - BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP
 * #1 - FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo
 * #2 - 27h6cm6S9ag5y4ASi1a1vbTSKEsQMjEdfvZ6atPjmbuD
 */
const mockGetBip32Deriver = jest.fn().mockResolvedValue({
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
});

jest.mock('../utils/get-bip32-deriver', () => ({
  getBip32Deriver: () => mockGetBip32Deriver(),
}));

describe('SolanaWallet', () => {
  let solanaWallet: SolanaWallet;

  beforeEach(() => {
    solanaWallet = new SolanaWallet();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deriveAddress', () => {
    it('should derive address #1 correctly', async () => {
      const index = 0;
      const address = await solanaWallet.deriveAddress(index);

      expect(address).toBe('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP');
    });

    it('should derive address #2 correctly', async () => {
      const index = 1;
      const address = await solanaWallet.deriveAddress(index);

      expect(address).toBe('FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo');
    });

    it('should derive address #3 correctly', async () => {
      const index = 2;
      const address = await solanaWallet.deriveAddress(index);

      expect(address).toBe('27h6cm6S9ag5y4ASi1a1vbTSKEsQMjEdfvZ6atPjmbuD');
    });

    it('logs an error if derivation fails', async () => {
      const mockError = new Error('Could not derive address');

      mockGetBip32Deriver.mockRejectedValueOnce(mockError);

      await expect(solanaWallet.deriveAddress(0)).rejects.toThrow(
        mockError.message,
      );
    });
  });
});