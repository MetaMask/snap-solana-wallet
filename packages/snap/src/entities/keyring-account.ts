import type { EntropySourceId, KeyringAccount } from '@metamask/keyring-api';

/**
 * We need to store the index of the KeyringAccount in the state because
 * we want to be able to restore any account with a previously used index.
 */
export type SolanaKeyringAccount = {
  entropySource: EntropySourceId;
  derivationPath: `m/${string}`;
  index: number;
} & KeyringAccount;

/**
 * Converts a Solana keyring account to its stricter form (required by the Keyring API).
 *
 * @param account - A Solana keyring account.
 * @returns A strict keyring account (with no additional fields).
 */
export function asStrictKeyringAccount(
  account: SolanaKeyringAccount,
): KeyringAccount {
  const { type, id, address, options, methods, scopes } = account;
  return {
    type,
    id,
    address,
    options,
    methods,
    scopes,
  };
}
