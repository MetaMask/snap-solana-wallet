/* eslint-disable no-restricted-globals */

/**
 * Utility to access the snap environment variables at runtime.
 *
 * It's a wrapper around `process.env` to make it easier to access environment
 * variables, and write unit tests for services that depend on them, because
 * we can mock the `ConfigProvider` instead of `process.env`.
 *
 * @example
 * const configProvider = new ConfigProvider();
 * const priceApiBaseUrl = configProvider.safeGet('PRICE_API_BASE_URL');
 */
export class ConfigProvider {
  get(envVar: string): string | undefined {
    return process.env[envVar];
  }

  safeGet(envVar: string): string {
    const value = this.get(envVar);
    if (value === undefined) {
      throw new Error(`Environment variable "${envVar}" not found`);
    }
    return value;
  }
}
