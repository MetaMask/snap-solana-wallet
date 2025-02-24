import type { KeyringAccount } from '@metamask/keyring-api';

/**
 * Finds the account ID from the address.
 * @param accounts - The accounts to search through.
 * @param address - The address to find the account ID for.
 * @returns The account ID if found, otherwise undefined.
 */
export function getAccountIdFromAddress(
  accounts: KeyringAccount[],
  address: string,
): string | undefined {
  return accounts.find((account) => account.address === address)?.id;
}
