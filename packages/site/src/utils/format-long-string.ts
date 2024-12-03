/**
 * Format a long string to a shorter format.
 *
 * @param string - The string to format.
 * @returns The formatted string.
 */
export function formatLongString(string: string) {
  if (!string) {
    return '';
  }

  return `${string.slice(0, 4)}...${string.slice(-4)}`;
}
