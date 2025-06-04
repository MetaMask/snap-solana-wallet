import {
  MOCK_SEED_PHRASE_ENTROPY_SOURCE,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES,
} from '../../../domain';

export const deriveSolanaKeypairMock = jest
  .fn()
  .mockImplementation((params) => {
    const { entropySource = MOCK_SEED_PHRASE_ENTROPY_SOURCE, derivationPath } =
      params;

    const account = MOCK_SOLANA_KEYRING_ACCOUNTS.find(
      (currentAccount) =>
        entropySource === currentAccount.entropySource &&
        derivationPath === currentAccount.derivationPath,
    );

    if (!account) {
      throw new Error('[deriveSolanaAddress] Not enough mocked indices');
    }

    return {
      privateKeyBytes:
        MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES[account.id],
      publicKeyBytes: null, // We don't need public key bytes for the tests
    };
  });
