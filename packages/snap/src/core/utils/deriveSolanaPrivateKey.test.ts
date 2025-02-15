import type { SLIP10PathNode, SupportedCurve } from '@metamask/key-tree';
import { SLIP10Node } from '@metamask/key-tree';

import {
  MOCK_SEED_PHRASE_BYTES,
  MOCK_SOLANA_KEYRING_ACCOUNT_0_PRIVATE_KEY_BYTES,
  MOCK_SOLANA_KEYRING_ACCOUNT_1_PRIVATE_KEY_BYTES,
  MOCK_SOLANA_KEYRING_ACCOUNT_2_PRIVATE_KEY_BYTES,
  MOCK_SOLANA_KEYRING_ACCOUNT_3_PRIVATE_KEY_BYTES,
  MOCK_SOLANA_KEYRING_ACCOUNT_4_PRIVATE_KEY_BYTES,
} from '../test/mocks/solana-keyring-accounts';
import { deriveSolanaPrivateKey } from './deriveSolanaPrivateKey';
import { getBip32Entropy } from './getBip32Entropy';

/**
 * Using the seed phrase:
 * sugar interest animal afford dog imitate relief lizard width strategy embark midnight
 *
 * Yields the following root node from getBip32Deriver:
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
 * Returns the following addresses per index, using Solana's derivation path
 * `m`, `44'`, `501'`, `${index}'`, `0'`:
 *
 * #0 - BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP
 * #1 - FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo
 * #2 - 27h6cm6S9ag5y4ASi1a1vbTSKEsQMjEdfvZ6atPjmbuD
 * #3 - 3SYHDFbhoxuTCYCGRw7KSL8GbwUoByjtvyy7pUZeAhh8
 * #4 - FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK
 *
 * And the private keys you see in the first test case below.
 */

jest.mock('./getBip32Entropy');
jest.mock('./logger');

describe('deriveSolanaPrivateKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getBip32Entropy as jest.Mock).mockImplementation(
      async (path: string[], curve: SupportedCurve) => {
        return await SLIP10Node.fromDerivationPath({
          derivationPath: [
            MOCK_SEED_PHRASE_BYTES,
            ...path.slice(1).map((node) => `slip10:${node}` as SLIP10PathNode),
          ],
          curve,
        });
      },
    );
  });

  it('successfully derives Solana private keys', async () => {
    const { privateKeyBytes: firstPrivateKey } = await deriveSolanaPrivateKey(
      0,
    );
    const { privateKeyBytes: secondPrivateKey } = await deriveSolanaPrivateKey(
      1,
    );
    const { privateKeyBytes: thirdPrivateKey } = await deriveSolanaPrivateKey(
      2,
    );
    const { privateKeyBytes: fourthPrivateKey } = await deriveSolanaPrivateKey(
      3,
    );
    const { privateKeyBytes: fifthPrivateKey } = await deriveSolanaPrivateKey(
      4,
    );

    expect(firstPrivateKey).toStrictEqual(
      MOCK_SOLANA_KEYRING_ACCOUNT_0_PRIVATE_KEY_BYTES,
    );
    expect(secondPrivateKey).toStrictEqual(
      MOCK_SOLANA_KEYRING_ACCOUNT_1_PRIVATE_KEY_BYTES,
    );
    expect(thirdPrivateKey).toStrictEqual(
      MOCK_SOLANA_KEYRING_ACCOUNT_2_PRIVATE_KEY_BYTES,
    );
    expect(fourthPrivateKey).toStrictEqual(
      MOCK_SOLANA_KEYRING_ACCOUNT_3_PRIVATE_KEY_BYTES,
    );
    expect(fifthPrivateKey).toStrictEqual(
      MOCK_SOLANA_KEYRING_ACCOUNT_4_PRIVATE_KEY_BYTES,
    );
  });

  it('throws error if unable to derive private key', async () => {
    jest.mocked(getBip32Entropy).mockResolvedValue({} as any);

    await expect(deriveSolanaPrivateKey(0)).rejects.toThrow(
      'Unable to derive private key',
    );
  });

  it('throws error if getBip32Entropy fails', async () => {
    const errorMessage = 'Failed to get entropy';
    (getBip32Entropy as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(deriveSolanaPrivateKey(0)).rejects.toThrow(errorMessage);
  });
});
