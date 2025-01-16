/**
 * Extracts the token address from a CAIP-19 ID.
 * @param caip19Id - The CAIP-19 ID to extract the token address from.
 * @returns The extracted token address.
 * @throws {Error} If the CAIP-19 ID is invalid.
 */
export function caip19ToTokenAddress(caip19Id: string): string {
  const tokenAddress = caip19Id.split('/token:')[1];

  if (!tokenAddress) {
    throw new Error('Invalid CAIP-19 ID');
  }

  return tokenAddress;
}
