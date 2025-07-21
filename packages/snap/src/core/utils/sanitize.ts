/**
 * Sanitization utilities for preventing control character injection attacks.
 * These utilities help to ensure that user-controlled input is safe for display
 * and processing in sign-in messages and other security-critical contexts.
 */
/**
 * Removes or escapes control characters from a string.
 * Control characters include newlines, carriage returns, tabs, and other non-printable characters.
 *
 * @param input - The string to sanitize
 * @returns The sanitized string with control characters removed
 */
export function sanitizeControlCharacters(input: string): string {
  if (!input || typeof input !== 'string') {
    return input || '';
  }

  // Remove all control characters (0x00-0x1F, 0x7F) except tab (0x09)
  // Tabs are preserved because they're commonly used for formatting and safe
  // Also removes some extended control characters (0x80-0x9F)
  return input.replace(/[\x00-\x08\x0A-\x1F\x7F]/gu, '');
}

/**
 * Sanitizes a string for use in sign-in messages by removing control characters
 * and limiting length to prevent abuse.
 *
 * @param input - The string to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns The sanitized string
 */
export function sanitizeForSignInMessage(
  input: string,
  maxLength: number = 1000,
): string {
  if (!input || typeof input !== 'string') {
    return input || '';
  }

  // Removes control characters
  let sanitized = sanitizeControlCharacters(input);

  // If sanitization didn't change anything, return the original
  if (sanitized === input) {
    return input;
  }

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validates and sanitizes a domain name for use in sign-in messages.
 *
 * @param domain - The domain to validate and sanitize
 * @returns The sanitized domain or empty string if invalid
 */
export function sanitizeDomain(domain: string): string {
  if (!domain || typeof domain !== 'string') {
    return domain || '';
  }

  let sanitized = sanitizeControlCharacters(domain);

  // If sanitization didn't change anything, return the original
  if (sanitized === domain) {
    return domain;
  }

  // For domains with control characters removed, try to extract a valid domain part
  // This handles cases like "example.com\n<script>alert(1)</script>" -> "example.com"
  const domainMatch = sanitized.match(/^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+)/);
  if (domainMatch && domainMatch[1]) {
    sanitized = domainMatch[1];
  }

  // Basic domain validation - should contain at least one dot and valid characters
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/u;

  if (!domainRegex.test(sanitized)) {
    return '';
  }

  // RFC 1035 domain name length limit
  // This ensures that any domain name we accept follows the official DNS standard,
  // preventing potential issues with DNS resolution or compatibility problems.
  if (sanitized.length > 253) {
    return '';
  }

  return sanitized.toLowerCase();
}

/**
 * Validates and sanitizes a Solana address for use in sign-in messages.
 *
 * @param address - The address to validate and sanitize
 * @returns The sanitized address or empty string if invalid
 */
export function sanitizeSolanaAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    return address || '';
  }

  let sanitized = sanitizeControlCharacters(address);

  // If sanitization didn't change anything, return the original
  if (sanitized === address) {
    return address;
  }

  // Basic Solana address validation (Base58 format) - this ensures that the address is a valid Solana address
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
 * Validates and sanitizes a URI for use in sign-in messages.
 *
 * @param uri - The URI to validate and sanitize
 * @returns The sanitized URI or empty string if invalid
 */
export function sanitizeUri(uri: string): string {
  if (!uri || typeof uri !== 'string') {
    return uri || '';
  }

  let sanitized = sanitizeControlCharacters(uri);

  // If sanitization didn't change anything, return the original
  if (sanitized === uri) {
    return uri;
  }

  // If sanitization removed characters, the URL might be invalid
  try {
    new URL(sanitized);
  } catch {
    return '';
  }

  try {
    // Basic URL validation
    const url = new URL(sanitized);

    const allowedProtocols = ['http:', 'https:', 'wss:'];
    if (!allowedProtocols.includes(url.protocol)) {
      return '';
    }

    // Limit length
    if (sanitized.length > 2048) {
      return '';
    }

    return sanitized;
  } catch {
    return '';
  }
}

/**
 * Validates and sanitizes a timestamp string for use in sign-in messages.
 *
 * @param timestamp - The timestamp to validate and sanitize
 * @returns The sanitized timestamp or empty string if invalid
 */
export function sanitizeTimestamp(timestamp: string): string {
  if (!timestamp || typeof timestamp !== 'string') {
    return timestamp || '';
  }

  // Remove control characters
  let sanitized = sanitizeControlCharacters(timestamp);

  // If sanitization didn't change anything, return the original
  if (sanitized === timestamp) {
    return timestamp;
  }

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
 * Validates and sanitizes an array of resource strings for use in sign-in messages.
 *
 * @param resources - The resources array to validate and sanitize
 * @returns The sanitized resources array
 */
export function sanitizeResources(resources: string[]): string[] {
  if (!Array.isArray(resources)) {
    return resources || [];
  }

  const sanitized = resources
    .filter((resource) => typeof resource === 'string')
    .map((resource) => sanitizeUri(resource))
    .filter((resource) => resource !== '');

  // If no resources were sanitized (all were invalid), return original if it was valid
  if (sanitized.length === 0 && resources.length > 0) {
    // Check if original resources were valid
    const originalValid = resources
      .filter((resource) => typeof resource === 'string')
      .every((resource) => {
        try {
          new URL(resource);
          return true;
        } catch {
          return false;
        }
      });
    
    if (originalValid) {
      return resources;
    }
  }

  return sanitized;
}
