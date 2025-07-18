import { assert } from '@metamask/superstruct';

import { UrlStruct } from '../validation/structs';

export type BuildUrlParams = {
  baseUrl: string;
  path: string;
  pathParams?: Record<string, string> | undefined;
  queryParams?: Record<string, string> | undefined;
};

/**
 * Builds a URL with the given base URL and parameters:
 * - The `URL` API provides proper URL parsing and encoding.
 * - The `path` is sanitized to prevent path traversal attacks.
 *
 * Ensures that the built URL is safe, valid, and sanitized.
 *
 * @param params - The parameters to build the URL from.
 * @returns The built URL.
 */
export function buildUrl(params: BuildUrlParams): string {
  const { baseUrl, path, pathParams, queryParams } = params;

  assert(baseUrl, UrlStruct);

  const pathWithParams = path.replace(/\{(\w+)\}/gu, (_, key: string) => {
    const value = pathParams?.[key];
    if (value === undefined) {
      throw new Error(`Path parameter ${key} is undefined`);
    }
    return value;
  });

  const cleanPath = pathWithParams
    .replace(/^\/+/u, '') // Remove leading slashes
    .replace(/\/+/gu, '/') // Replace multiple slashes with single
    .replace(/\/+$/u, ''); // Remove trailing slashes

  const url = new URL(cleanPath, baseUrl);
  Object.entries(queryParams ?? {})
    .filter(([_, value]) => value !== undefined)
    .filter(([_, value]) => value !== null)
    .forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, value);
      }
    });

  const builtUrl = url.toString();
  assert(builtUrl, UrlStruct);
  return builtUrl;
}
