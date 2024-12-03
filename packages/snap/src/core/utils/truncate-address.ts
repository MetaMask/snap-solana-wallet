/**
 * Truncates an address to show the first 6 and last 4 characters, separated by ellipses.
 * @param address - The address to truncate.
 * @returns The truncated address.
 */
export function truncateAddress(address: string): string {
  if (!address) {
    return '';
  }

  if (address.length <= 10) {
    return '';
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
