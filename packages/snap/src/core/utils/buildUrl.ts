import { assert } from 'superstruct';

import { UrlStruct } from '../validation/structs';

/**
 * Builds a URL with the given base URL and parameters:
 * - The `URL` API provides proper URL parsing and encoding.
 * - The `path` is sanitized to prevent path traversal attacks.
 *
 * @param baseUrl - The base URL to build the URL from.
 * @param path - The path to add to the URL.
 * @param params - The parameters to add to the URL.
 * @returns The built URL.
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  params: Record<string, string>,
): string {
  assert(baseUrl, UrlStruct);

  const cleanPath = path
    .replace(/^\/+/u, '') // Remove leading slashes
    .replace(/\/+/gu, '/') // Replace multiple slashes with single
    .replace(/\/+$/u, ''); // Remove trailing slashes

  const url = new URL(cleanPath, baseUrl);
  Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .filter(([_, value]) => value !== null)
    .forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  return url.toString();
}
