import { Collator } from './Collator';

describe('Collator', () => {
  describe('constructor', () => {
    it('should use default locale when none provided', () => {
      const collator = new Collator();
      expect(collator.resolvedOptions().locale).toBe('en');
    });

    it('should use first locale from array', () => {
      const collator = new Collator(['fr', 'en']);
      expect(collator.resolvedOptions().locale).toBe('fr');
    });

    it('should use default options when none provided', () => {
      const collator = new Collator();
      expect(collator.resolvedOptions()).toStrictEqual({
        locale: 'en',
        usage: 'sort',
        sensitivity: 'variant',
        ignorePunctuation: false,
        numeric: false,
        caseFirst: 'false',
      });
    });
  });

  describe('compare', () => {
    it('should compare strings basic', () => {
      const collator = new Collator();
      expect(collator.compare('a', 'b')).toBeLessThan(0);
      expect(collator.compare('b', 'a')).toBeGreaterThan(0);
      expect(collator.compare('a', 'a')).toBe(0);
    });

    it('should handle ignorePunctuation option', () => {
      const collator = new Collator('en', { ignorePunctuation: true });
      expect(collator.compare('hello!', 'hello')).toBe(0);
      expect(collator.compare('hi.there', 'hithere')).toBe(0);
    });

    it('should respect numeric sorting', () => {
      const collator = new Collator('en', { numeric: true });
      expect(collator.compare('2', '10')).toBeLessThan(0);
    });
  });

  describe('supportedLocalesOf', () => {
    it('should handle single locale', () => {
      expect(Collator.supportedLocalesOf('en')).toStrictEqual(['en']);
    });

    it('should handle array of locales', () => {
      expect(Collator.supportedLocalesOf(['en', 'fr'])).toStrictEqual([
        'en',
        'fr',
      ]);
    });
  });

  describe('resolvedOptions', () => {
    it('should return merged options', () => {
      const collator = new Collator('fr', {
        usage: 'search',
        sensitivity: 'base',
        ignorePunctuation: true,
        numeric: true,
        caseFirst: 'upper',
      });

      expect(collator.resolvedOptions()).toStrictEqual({
        locale: 'fr',
        usage: 'search',
        sensitivity: 'base',
        ignorePunctuation: true,
        numeric: true,
        caseFirst: 'upper',
      });
    });
  });
});
