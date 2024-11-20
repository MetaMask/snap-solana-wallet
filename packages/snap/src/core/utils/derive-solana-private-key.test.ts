import { SLIP10Node } from '@metamask/key-tree';

import { deriveSolanaPrivateKey } from './derive-solana-private-key';
import { getBip32Entropy } from './get-bip32-entropy';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
} from '../test/mocks/solana-keyring-accounts';

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

jest.mock('./get-bip32-entropy');
jest.mock('./logger');

describe('deriveSolanaPrivateKey', () => {
  const mockRootNode = {
    depth: 2,
    masterFingerprint: 3974444335,
    parentFingerprint: 2046425034,
    index: 2147484149,
    curve: 'ed25519' as const,
    privateKey:
      '0x7acf6060833428c2196ce6e2c5ba5455394602814b9ec6b9bac453b357be7b24',
    publicKey:
      '0x00389ed03449fbc42a3ec134609b664a50e7a78bad800bad1629113590bfc9af9b',
    chainCode:
      '0x99d7cef35ae591a92eab31e0007f0199e3bea62d211a219526bf2ae06799886d',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getBip32Entropy as jest.Mock).mockResolvedValue(mockRootNode);
  });

  it('should successfully derive Solana private keys', async () => {
    const firstPrivateKey = await deriveSolanaPrivateKey(0);
    const secondPrivateKey = await deriveSolanaPrivateKey(1);
    const thirdPrivateKey = await deriveSolanaPrivateKey(2);
    const fourthPrivateKey = await deriveSolanaPrivateKey(3);
    const fifthPrivateKey = await deriveSolanaPrivateKey(4);

    expect(firstPrivateKey).toStrictEqual(
      new Uint8Array(MOCK_SOLANA_KEYRING_ACCOUNT_0.privateKeyBytesAsNum),
    );
    expect(secondPrivateKey).toStrictEqual(
      new Uint8Array(MOCK_SOLANA_KEYRING_ACCOUNT_1.privateKeyBytesAsNum),
    );
    expect(thirdPrivateKey).toStrictEqual(
      new Uint8Array(MOCK_SOLANA_KEYRING_ACCOUNT_2.privateKeyBytesAsNum),
    );
    expect(fourthPrivateKey).toStrictEqual(
      new Uint8Array(MOCK_SOLANA_KEYRING_ACCOUNT_3.privateKeyBytesAsNum),
    );
    expect(fifthPrivateKey).toStrictEqual(
      new Uint8Array(MOCK_SOLANA_KEYRING_ACCOUNT_4.privateKeyBytesAsNum),
    );
  });

  it('should throw error if unable to derive private key', async () => {
    const mockDeriveMethod = jest.fn().mockResolvedValue({
      privateKeyBytes: null,
    });
    const mockNode = {
      derive: mockDeriveMethod,
    };
    jest.spyOn(SLIP10Node, 'fromJSON').mockResolvedValue(mockNode as any);

    await expect(deriveSolanaPrivateKey(0)).rejects.toThrow(
      'Unable to derive private key',
    );
  });

  it('should throw error if getBip32Entropy fails', async () => {
    const errorMessage = 'Failed to get entropy';
    (getBip32Entropy as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(deriveSolanaPrivateKey(0)).rejects.toThrow(errorMessage);
  });
});
