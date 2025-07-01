import { isSolanaDomain } from './isSolanaDomain';

describe('isSolanaDomain', () => {
  describe('when given a valid Solana domain', () => {
    it('returns true for domain ending with .sol', () => {
      expect(isSolanaDomain('example.sol')).toBe(true);
    });

    it('returns true for subdomain ending with .sol', () => {
      expect(isSolanaDomain('sub.example.sol')).toBe(true);
    });

    it('returns true for domain with numbers ending with .sol', () => {
      expect(isSolanaDomain('test123.sol')).toBe(true);
    });

    it('returns true for domain with hyphens ending with .sol', () => {
      expect(isSolanaDomain('my-domain.sol')).toBe(true);
    });
  });

  describe('when given an invalid domain', () => {
    it('returns false for domain ending with .com', () => {
      expect(isSolanaDomain('example.com')).toBe(false);
    });

    it('returns false for domain ending with .org', () => {
      expect(isSolanaDomain('example.org')).toBe(false);
    });

    it('returns false for domain without extension', () => {
      expect(isSolanaDomain('example')).toBe(false);
    });

    it('returns false for domain ending with .solx', () => {
      expect(isSolanaDomain('example.solx')).toBe(false);
    });

    it('returns false for domain with .sol in the middle', () => {
      expect(isSolanaDomain('example.sol.com')).toBe(false);
    });
  });

  describe('when given edge cases', () => {
    it('returns false for null input', () => {
      expect(isSolanaDomain(null)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isSolanaDomain('')).toBe(false);
    });

    it('returns true for string with only .sol', () => {
      expect(isSolanaDomain('.sol')).toBe(true);
    });

    it('returns false for string ending with .SOL (uppercase)', () => {
      expect(isSolanaDomain('example.SOL')).toBe(false);
    });

    it('returns false for string ending with .Sol (mixed case)', () => {
      expect(isSolanaDomain('example.Sol')).toBe(false);
    });
  });
});
