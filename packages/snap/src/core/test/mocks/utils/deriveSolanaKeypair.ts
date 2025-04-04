import {
  MOCK_SOLANA_KEYRING_ACCOUNTS,
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES,
} from '../solana-keyring-accounts';

export const deriveSolanaKeypairMock = jest
  .fn()
  .mockImplementation(({ index }) => {
    const account = MOCK_SOLANA_KEYRING_ACCOUNTS[index];

    if (!account) {
      throw new Error('[deriveSolanaAddress] Not enough mocked indices');
    }

    return {
      privateKeyBytes:
        MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES[account.id],
      publicKeyBytes: null, // We don't need public key bytes for the tests
    };
  });
