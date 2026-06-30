import {
  KNOWN_ORIGIN_LABELS,
  WALLET_CONNECT_ORIGIN,
} from '../constants/solana';

/**
 * Parses the origin into a human-readable display label.
 *
 * @param origin - The origin to parse.
 * @returns The display label: a known-origin label, the hostname for http(s) URLs.
 */
export function parseOrigin(origin: string) {
  const knownLabel = KNOWN_ORIGIN_LABELS[origin?.toLowerCase()];
  if (knownLabel) {
    return knownLabel;
  }

  try {
    const url = new URL(origin);
    if (!isHttpOrHttpsUrl(url)) {
      throw new Error('Invalid url');
    }
    return url.hostname;
  } catch (error) {
    throw new Error(
      `Invalid origin: ${origin}. Must be a valid URL or a known origin.`,
    );
  }
}

/**
 * Checks whether an origin is a known origin.
 *
 * @param origin - The origin to check.
 * @returns Whether the origin is a known origin.
 */
export function isKnownOrigin(origin: string | undefined): boolean {
  return [...Object.keys(KNOWN_ORIGIN_LABELS)].includes(
    origin?.toLowerCase() ?? '',
  );
}

/**
 * Checks whether a parsed URL uses an HTTP(S) protocol.
 *
 * @param url - The parsed URL to check.
 * @returns Whether the URL uses HTTP or HTTPS.
 */
function isHttpOrHttpsUrl(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:';
}
