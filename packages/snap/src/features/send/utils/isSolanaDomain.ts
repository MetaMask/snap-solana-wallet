/**
 * Checks if a domain is a Solana domain (.sol).
 *
 * @param domain - The domain to check.
 * @returns `true` if the domain ends with `.sol`, `false` otherwise. Returns `false` if the domain is `null`.
 */
export function isSolanaDomain(domain: string | null): boolean {
  return domain?.endsWith('.sol') ?? false;
}
