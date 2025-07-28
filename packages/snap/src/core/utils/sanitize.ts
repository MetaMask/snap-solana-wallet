/**
 * Removes control characters from a string.
 * @param input - The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeControlCharacters(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove all control characters except tab
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u0008\u000A-\u001F\u007F]/gu, '');
}

/**
 * Sanitizes a string for use in sign-in messages.
 * @param input - The string to sanitize.
 * @param maxLength - Maximum allowed length.
 * @returns The sanitized string.
 */
export function sanitizeForSignInMessage(
  input: string,
  maxLength = 1000,
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Removes control characters
  let sanitized = sanitizeControlCharacters(input);

  // Limit length for all inputs
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Trim whitespace
  sanitized = sanitized.trim();

  // If sanitization didn't change anything, return the original
  if (sanitized === input) {
    return sanitized;
  }

  return sanitized;
}

/**
 * Validates and sanitizes a domain name.
 * @param domain - The domain to validate and sanitize.
 * @returns The sanitized domain or empty string if invalid.
 */
export function sanitizeDomain(domain: string): string {
  if (!domain || typeof domain !== 'string') {
    return '';
  }

  let sanitized = sanitizeControlCharacters(domain);

  // Extract valid domain part from potentially malicious input
  const domainMatch = sanitized.match(
    /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+)/u,
  );
  if (domainMatch?.[1]) {
    sanitized = domainMatch[1];
  }

  // Basic domain validation - should contain at least one dot and valid characters
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/u;

  if (!domainRegex.test(sanitized)) {
    return '';
  }

  // RFC 1035 domain name length limit
  if (sanitized.length > 253) {
    return '';
  }

  return sanitized.toLowerCase();
}

/**
 * Validates and sanitizes a Solana address.
 * @param address - The address to validate and sanitize.
 * @returns The sanitized address or empty string if invalid.
 */
export function sanitizeSolanaAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    return '';
  }

  const sanitized = sanitizeControlCharacters(address);

  // Basic Solana address validation (Base58 format)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/u;

  if (!base58Regex.test(sanitized)) {
    return '';
  }

  // Solana addresses are 32 or 44 characters long
  if (sanitized.length < 32 || sanitized.length > 44) {
    return '';
  }

  return sanitized;
}

/**
 * Validates and sanitizes a URI.
 * @param uri - The URI to validate and sanitize.
 * @returns The sanitized URI or empty string if invalid.
 */
export function sanitizeUri(uri: string): string {
  if (!uri || typeof uri !== 'string') {
    return '';
  }

  const sanitized = sanitizeControlCharacters(uri);

  try {
    const url = new URL(sanitized);
    const allowedProtocols = ['http:', 'https:', 'wss:', 'ipfs:'];
    if (!allowedProtocols.includes(url.protocol)) {
      return '';
    }
    if (sanitized.length > 2048) {
      return '';
    }
    return sanitized;
  } catch {
    return '';
  }
}

/**
 * Validates and sanitizes a timestamp string.
 * @param timestamp - The timestamp to validate and sanitize.
 * @returns The sanitized timestamp or empty string if invalid.
 */
export function sanitizeTimestamp(timestamp: string): string {
  if (!timestamp || typeof timestamp !== 'string') {
    return '';
  }

  const sanitized = sanitizeControlCharacters(timestamp);

  // Basic ISO 8601 timestamp validation
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/u;

  if (!isoRegex.test(sanitized)) {
    return '';
  }

  // Validate that it's a valid date
  const date = new Date(sanitized);
  if (isNaN(date.getTime())) {
    return '';
  }

  return sanitized;
}

/**
 * Validates and sanitizes an array of resource strings.
 * @param resources - The resources array to validate and sanitize.
 * @returns The sanitized resources array.
 */
export function sanitizeResources(resources: string[]): string[] {
  if (!Array.isArray(resources)) {
    return [];
  }

  const sanitized = resources
    .filter((resource) => typeof resource === 'string')
    .map((resource) => sanitizeUri(resource))
    .filter((resource) => resource !== '');

  return sanitized;
}
