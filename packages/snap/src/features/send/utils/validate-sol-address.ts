/**
 * Validates a Solana address by checking if it follows the Base58 encoding format.
 *
 * @param address - The address string to validate.
 * @returns A boolean indicating whether the address is valid.
 * @description
 * Valid addresses must:
 * - Be between 32 and 44 characters long
 * - Only contain Base58 characters (1-9, A-H, J-N, P-Z, a-k, m-z)
 *
 * Note: Future implementation will support .sol domain names.
 */
export function validateSolAddress(address: string): boolean {
  // to be used later
  // const isSolDomain = typeof address === 'string' && address?.endsWith('.sol');

  // validate against the Base58 encoding that Solana uses
  const isValidSolAddress =
    typeof address === 'string' &&
    /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{32,44}$/u.test(
      address,
    );

  return isValidSolAddress;
}
