import { METAMASK_ORIGIN } from '../constants/solana';

/**
 * Parses the origin from a string.
 *
 * @param origin - The origin to parse.
 * @returns The parsed origin.
 */
export function parseOrigin(origin: string) {
  if (origin === METAMASK_ORIGIN) {
    return 'MetaMask';
  }

  try {
    return new URL(origin).hostname;
  } catch (error) {
    throw new Error('Invalid URL');
  }
}
