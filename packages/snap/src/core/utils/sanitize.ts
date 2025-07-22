/**
 * Sanitization utilities for preventing control character injection attacks.
 * 
 * These utilities help to ensure that user-controlled input is safe for display
 * and processing in sign-in messages and other security-critical contexts.
 */

/**
 * Removes control characters from a string.
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
  return input.replace(/[\u0000-\u0008\u000A-\u001F\u007F]/gu, '');
}

/**
 * Sanitizes a string for use in sign-in messages.
 * 
 * @param input - The string to sanitize
 * @param maxLength - Maximum allowed length
 * @returns The sanitized string
 */
export function sanitizeForSignInMessage(
  input: string,
  maxLength = 1000,
): string {
  if (!input || typeof input !== 'string') {
    return input || '';
  }

  // Removes control characters
  let sanitized = sanitizeControlCharacters(input);

  // Limit length for all inputs
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // If sanitization didn't change anything, return the original
  if (sanitized === input) {
    return sanitized;
  }

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validates and sanitizes a domain name.
 * 
 * @param domain - The domain to validate and sanitize
 * @returns The sanitized domain or empty string if invalid
 */
export function sanitizeDomain(domain: string): string {
  if (!domain || typeof domain !== 'string') {
    return domain || '';
  }

  let sanitized = sanitizeControlCharacters(domain);

  // For domains with control characters removed, try to extract a valid domain part
  // This handles cases like "example.com\n<script>alert(1)</script>" -> "example.com"
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
  // This ensures that any domain name we accept follows the official DNS standard,
  // preventing potential issues with DNS resolution or compatibility problems.
  if (sanitized.length > 253) {
    return '';
  }

  return sanitized.toLowerCase();
}

/**
 * Validates and sanitizes a Solana address.
 * 
 * @param address - The address to validate and sanitize
 * @returns The sanitized address or empty string if invalid
 */
export function sanitizeSolanaAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    return address || '';
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
 * Validates and sanitizes a URI for use in sign-in messages.
 * 
 * @param uri - The URI to validate and sanitize
 * @returns The sanitized URI or empty string if invalid
 */
export function sanitizeUri(uri: string): string {
  if (!uri || typeof uri !== 'string') {
    return uri || '';
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
 * 
 * @param timestamp - The timestamp to validate and sanitize
 * @returns The sanitized timestamp or empty string if invalid
 */
export function sanitizeTimestamp(timestamp: string): string {
  if (!timestamp || typeof timestamp !== 'string') {
    return timestamp || '';
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
          const url = new URL(resource);
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
