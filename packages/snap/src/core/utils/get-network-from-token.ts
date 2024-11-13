/**
 * Extracts the network identifier from a CAIP-19 token string.
 *
 * @param caip19Token - The CAIP-19 token string, which is expected to be in the format 'network/token'.
 * @returns The network identifier extracted from the CAIP-19 token string.
 */
export function getNetworkFromToken(caip19Token: string) {
  return caip19Token.split('/')[0];
}
