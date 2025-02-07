import { SolMethod } from '@metamask/keyring-api';
import type { Infer } from 'superstruct';
import {
  array,
  enums,
  integer,
  nullable,
  number,
  object,
  optional,
  pattern,
  record,
  refine,
  string,
} from 'superstruct';

import { Network } from '../constants/solana';

// create a uuid validation
export const Uuid = pattern(
  string(),
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
);

export const PositiveNumber = refine(number(), 'positive', (value) => {
  if (value < 0) {
    return `Expected a positive number but received a negative number ${value}`;
  }
  return true;
});

export const PositiveNumberStringStruct = pattern(
  string(),
  /^(?!0\d)(\d+(\.\d+)?)$/u,
);

/**
 * Validates that a string is a valid and safe URL. Accepts http and https protocols.
 *
 * It rejects:
 * - Non-HTTP/HTTPS protocols
 * - Malformed URL format or incorrect protocol format
 * - Invalid hostname format (must follow proper domain naming conventions)
 * - Protocol pollution attempts (backslashes, @ symbol, %2f@, %5c@)
 * - Internal/localhost URLs over HTTPS (localhost, 127.0.0.1, 0.0.0.0, [::1], IPs starting with 0.)
 * - Invalid hostname characters (backslashes, @ symbol, forward slashes, encoded forward slashes)
 * - Directory traversal attempts (../, ..%2f, ..%2F)
 *
 * Dangerous patterns including:
 * - HTML tags.
 * - JavaScript protocol.
 * - Data URI scheme.
 * - Template injection (${...}, #{...}).
 * - Command injection (|, ;).
 * - CRLF injection.
 * - URL credential injection.
 * - SQL injection attempts.
 * - Open redirect parameters.
 * - Non-printable characters.
 */
export const UrlStruct = refine(string(), 'safe-url', (value) => {
  try {
    // Basic URL validation
    const url = new URL(value);

    // Protocol check
    if (!['http:', 'https:'].includes(url.protocol)) {
      return 'URL must use http or https protocol';
    }

    // Validate URL format
    if (!value.match(/^https?:\/\/[^/]+\/?/u)) {
      return 'Malformed URL - incorrect protocol format';
    }

    // Validate hostname format
    const hostname = url.hostname.toLowerCase();
    if (
      !hostname.includes('.') ||
      !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/u.test(
        hostname,
      )
    ) {
      return 'Invalid hostname format';
    }

    // Check for protocol pollution in the entire URL
    const decodedValue = decodeURIComponent(value.toLowerCase());
    if (
      value.includes('\\') ||
      value.includes('@') ||
      decodedValue.includes('\\') ||
      decodedValue.includes('@') ||
      value.toLowerCase().includes('%2f@') ||
      value.toLowerCase().includes('%5c@')
    ) {
      return 'URL contains protocol pollution attempts';
    }

    // Hostname checks
    if (
      url.protocol === 'https:' &&
      (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '[::1]' ||
        hostname.startsWith('0.') ||
        /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/u.test(hostname))
    ) {
      return 'Internal/localhost URLs over https are not allowed';
    }

    // Additional hostname safety check for protocol pollution
    const decodedHostname = decodeURIComponent(hostname);
    if (
      hostname.includes('\\') ||
      hostname.includes('@') ||
      decodedHostname.includes('/') ||
      hostname.toLowerCase().includes('%2f')
    ) {
      return 'Invalid hostname characters detected';
    }

    // Check for directory traversal
    if (
      value.includes('../') ||
      value.includes('..%2f') ||
      value.includes('..%2F')
    ) {
      return 'Directory traversal attempts are not allowed';
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /<[^>]*>/u, // HTML tags
      /javascript:/u, // JavaScript protocol
      /data:/u, // Data URI scheme
      /\\[@\\]/u, // Enhanced protocol pollution check
      /%2f@/u, // Protocol pollution
      /[^\x20-\x7E]/u, // Non-printable characters
      /\$\{.*?\}/u, // Template injection
      /#\{.*?\}/u, // Template injection
      /[|;]/u, // Command injection
      /%0[acd]|%0[acd]/u, // CRLF injection
      /\/\/\w+@/u, // URL credential injection
      // Enhanced SQL injection patterns
      /(?:[^a-z]|^)(?:union\s+(?:all\s+)?select|select\s+(?:.*\s+)?from|insert\s+into|update\s+.*\s+set|delete\s+from|drop\s+table|alter\s+table|create\s+table|exec(?:ute)?|union|where\s+[\d\w]\s*=\s*[\d\w]|\bor\b\s*[\d\w]\s*=\s*[\d\w])/iu,
      /'.*?(?:OR|UNION|SELECT|FROM|WHERE).*?'/iu, // SQL injection
      /%27.*?(?:OR|UNION|SELECT|FROM|WHERE).*?(?:%27|')/iu, // URL-encoded SQL injection
      /%20(?:OR|UNION|SELECT|FROM|WHERE)%20/iu, // URL-encoded SQL keywords
      /[?&](?:url|redirect|next|return_to|return_url|goto|destination|continue|redirect_uri)=(?:[^&]*\/\/|https?:)/iu, // Open redirect parameters
      /[?&](?:url|redirect|next|return_to|return_url|goto|destination|continue|redirect_uri)=%(?:[^&]*\/\/|https?:)/iu, // URL-encoded open redirect parameters
    ];

    for (const patt of dangerousPatterns) {
      if (patt.test(decodedValue)) {
        return 'URL contains potentially malicious patterns';
      }
    }

    return true;
  } catch (error) {
    return 'Invalid URL format';
  }
});

export const UrlStructRegex = pattern(
  string(),
  /^https?:\/\/(?!(?:localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(?::|\/))(?!.*?(?:\.\.\/|\.\.%2[fF]))[\w\-.]+(:\d+)?(?:\/[^/]*)*$/u,
);

/**
 * Validates a CAIP-19 asset identifier string, for instance
 * "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501"
 */
export const Caip19Struct = pattern(
  string(),
  /^[-a-z0-9]{3,8}:[-a-zA-Z0-9]{1,64}\/[-a-zA-Z0-9]{1,64}(:[-a-zA-Z0-9]{1,64})?$/u,
);

/**
 * Keyring validations
 */
export const GetAccountStruct = object({
  accountId: Uuid,
});
export const DeleteAccountStruct = object({
  accountId: Uuid,
});
export const ListAccountAssetsStruct = object({
  accountId: Uuid,
});
export const GetAccountBalancesStruct = object({
  accountId: Uuid,
  assets: array(Caip19Struct),
});
export const ListAccountTransactionsStruct = object({
  accountId: Uuid,
  pagination: object({
    limit: integer(),
    next: optional(nullable(string())),
  }),
});

export const GetAccounBalancesResponseStruct = record(
  Caip19Struct,
  object({
    amount: PositiveNumberStringStruct,
    unit: string(),
  }),
);

export const ListAccountAssetsResponseStruct = array(Caip19Struct);

export const SubmitRequestMethodStruct = enums(Object.values(SolMethod));

export const SendAndConfirmTransactionParamsStruct = object({
  base64EncodedTransactionMessage: string(),
});

export type SendAndConfirmTransactionParams = Infer<
  typeof SendAndConfirmTransactionParamsStruct
>;

export const NetworkStruct = enums(Object.values(Network));

export const Curenc = enums([
  'btc',
  'eth',
  'ltc',
  'bch',
  'bnb',
  'eos',
  'xrp',
  'xlm',
  'link',
  'dot',
  'yfi',
  'usd',
  'aed',
  'ars',
  'aud',
  'bdt',
  'bhd',
  'bmd',
  'brl',
  'cad',
  'chf',
  'clp',
  'cny',
  'czk',
  'dkk',
  'eur',
  'gbp',
  'gel',
  'hkd',
  'huf',
  'idr',
  'ils',
  'inr',
  'jpy',
  'krw',
  'kwd',
  'lkr',
  'mmk',
  'mxn',
  'myr',
  'ngn',
  'nok',
  'nzd',
  'php',
  'pkr',
  'pln',
  'rub',
  'sar',
  'sek',
  'sgd',
  'thb',
  'try',
  'twd',
  'uah',
  'vef',
  'vnd',
  'zar',
  'xdr',
  'xag',
  'xau',
  'bits',
  'sats',
]);
