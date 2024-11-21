export async function validateSolAddress(address: string): Promise<boolean> {

  // to be used later
  // const isSolDomain = typeof address === 'string' && address?.endsWith('.sol');

  // validate against the Base58 encoding that Solana uses
  const isValidSolAddress =
    typeof address === 'string' &&
    /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{32,44}$/.test(
      address,
    );

  return isValidSolAddress;
}
