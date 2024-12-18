/**
 * A basic polyfill implementation of the Intl.Collator class.
 *
 * @see https://developer.mozilla.orgwhere/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
 */
export class Collator {
  readonly #locale: string;

  readonly #options: CollatorOptions;

  // Add interface for type safety
  static supportedLocalesOf(
    locales: string | string[],
    options?: CollatorOptions,
  ): string[] {
    // Basic implementation - in reality would check against a list of supported locales
    const requestedLocales = Array.isArray(locales) ? locales : [locales];
    return requestedLocales;
  }

  constructor(locale?: string | string[], options: CollatorOptions = {}) {
    // Handle locale array input
    this.#locale = (Array.isArray(locale) ? locale[0] : locale) ?? 'en';

    // Normalize options with defaults
    this.#options = {
      usage: options.usage ?? 'sort',
      sensitivity: options.sensitivity ?? 'variant',
      ignorePunctuation: options.ignorePunctuation ?? false,
      numeric: options.numeric ?? false,
      caseFirst: options.caseFirst ?? 'false',
    };

    /**
     * Ensure that the `compare` method is bound to the instance of the class.
     * This is necessary because the `compare` method is called as a callback
     * and without binding, it would lose its `this` context.
     */
    this.compare = this.compare.bind(this);
  }

  /**
   * Basic implementation of `compare`.
   * For simplicity, it falls back to `localeCompare`.
   *
   * @param first - The first string to compare.
   * @param second - The second string to compare.
   * @returns The result of the comparison.
   */
  compare(first: string, second: string): number {
    let firstReplaced = first;
    let secondReplaced = second;

    if (this.#options.ignorePunctuation) {
      firstReplaced = first.replace(/[^\p{L}\p{N}]/gu, '');
      secondReplaced = second.replace(/[^\p{L}\p{N}]/gu, '');
    }

    return firstReplaced.localeCompare(
      secondReplaced,
      this.#locale,
      this.#options,
    );
  }

  resolvedOptions(): ResolvedCollatorOptions {
    return {
      locale: this.#locale,
      usage: this.#options.usage,
      sensitivity: this.#options.sensitivity,
      ignorePunctuation: this.#options.ignorePunctuation,
      numeric: this.#options.numeric,
      caseFirst: this.#options.caseFirst,
    };
  }

  toLocaleString() {
    return this.toString();
  }
}

// Add TypeScript interfaces
type CollatorOptions = {
  usage?: 'sort' | 'search' | undefined;
  sensitivity?: 'base' | 'accent' | 'case' | 'variant' | undefined;
  ignorePunctuation?: boolean | undefined;
  numeric?: boolean | undefined;
  caseFirst?: 'upper' | 'lower' | 'false' | undefined;
};

type ResolvedCollatorOptions = {
  locale: string;
} & Required<CollatorOptions>;
