/**
 * Checks if a domain is a Solana domain (.sol).
 *
 * @param domain - The domain to check.
 * @returns `true` if the domain is a valid domain ending with `.sol`, `false` otherwise. Returns `false` if the domain is `null`.
 */
export function isSolanaDomain(domain: string | null): boolean {
  if (!domain) {
    return false;
  }

  // Regex to match valid domain ending with .sol
  // Allows letters, numbers, hyphens, but not starting/ending with hyphen
  // Must have at least one character before .sol
  // Supports subdomains (e.g., sub.example.sol)
  const solanaDomainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.sol$/u;

  return solanaDomainRegex.test(domain);
}
