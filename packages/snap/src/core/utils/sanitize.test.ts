import {
  sanitizeControlCharacters,
  sanitizeForSignInMessage,
  sanitizeDomain,
  sanitizeSolanaAddress,
  sanitizeUri,
  sanitizeTimestamp,
  sanitizeResources,
} from './sanitize';

describe('sanitize', () => {
  describe('sanitizeControlCharacters', () => {
    it('removes control characters from strings', () => {
      expect(sanitizeControlCharacters('hello\nworld')).toBe('helloworld');
      expect(sanitizeControlCharacters('hello\r\nworld')).toBe('helloworld');
      // The tab character is preserved
      expect(sanitizeControlCharacters('hello\tworld')).toBe('hello\tworld');
      expect(sanitizeControlCharacters('hello\x00world')).toBe('helloworld');
      expect(sanitizeControlCharacters('hello\x1Fworld')).toBe('helloworld');
    });

    it('handles edge cases', () => {
      expect(sanitizeControlCharacters('')).toBe('');
      expect(sanitizeControlCharacters(null as any)).toBe('');
      expect(sanitizeControlCharacters(undefined as any)).toBe('');
      expect(sanitizeControlCharacters('normal text')).toBe('normal text');
    });
  });

  describe('sanitizeForSignInMessage', () => {
    it('sanitizes strings for sign-in messages', () => {
      expect(sanitizeForSignInMessage('hello\nworld')).toBe('helloworld');
      expect(sanitizeForSignInMessage('normal text')).toBe('normal text');
    });

    it('limits length', () => {
      const longString = 'a'.repeat(2000);
      const result = sanitizeForSignInMessage(longString, 100);
      expect(result).toHaveLength(100);
    });

    it('handles edge cases', () => {
      expect(sanitizeForSignInMessage('')).toBe('');
      expect(sanitizeForSignInMessage(null as any)).toBe('');
      expect(sanitizeForSignInMessage(undefined as any)).toBe('');
    });
  });

  describe('sanitizeDomain', () => {
    it('validates and sanitizes valid domains', () => {
      expect(sanitizeDomain('example.com')).toBe('example.com');
      expect(sanitizeDomain('sub.example.com')).toBe('sub.example.com');
      expect(sanitizeDomain('EXAMPLE.COM')).toBe('example.com');
      expect(sanitizeDomain('test-domain.com')).toBe('test-domain.com');
    });

    it('rejects invalid domains', () => {
      expect(sanitizeDomain('')).toBe('');
      expect(sanitizeDomain('not-a-domain')).toBe('');
      expect(sanitizeDomain('-invalid.com')).toBe('');
      expect(sanitizeDomain('invalid-.com')).toBe('');
    });

    it('sanitizes domains with control characters', () => {
      expect(sanitizeDomain('example.com\n')).toBe('example.com');
      expect(sanitizeDomain('sub.example.com\r')).toBe('sub.example.com');
    });

    it('handles edge cases', () => {
      expect(sanitizeDomain(null as any)).toBe('');
      expect(sanitizeDomain(undefined as any)).toBe('');
    });
  });

  describe('sanitizeSolanaAddress', () => {
    it('validates and sanitizes valid Solana addresses', () => {
      expect(
        sanitizeSolanaAddress('5Q444645Hz4hD7AuSj5z8m6jKLd3TxoMwp4Y7UWVKGqy'),
      ).toBe('5Q444645Hz4hD7AuSj5z8m6jKLd3TxoMwp4Y7UWVKGqy');
      expect(sanitizeSolanaAddress('11111111111111111111111111111112')).toBe(
        '11111111111111111111111111111112',
      );
    });

    it('rejects invalid addresses', () => {
      expect(sanitizeSolanaAddress('')).toBe('');
      expect(sanitizeSolanaAddress('invalid-address')).toBe('');
      // Short address
      expect(sanitizeSolanaAddress('123')).toBe('');
      // Long address
      expect(sanitizeSolanaAddress('a'.repeat(50))).toBe('');
    });

    it('sanitizes addresses with control characters', () => {
      expect(
        sanitizeSolanaAddress('5Q444645Hz4hD7AuSj5z8m6jKLd3TxoMwp4Y7UWVKGqy\n'),
      ).toBe('5Q444645Hz4hD7AuSj5z8m6jKLd3TxoMwp4Y7UWVKGqy');
      expect(sanitizeSolanaAddress('11111111111111111111111111111112\r')).toBe(
        '11111111111111111111111111111112',
      );
    });

    it('handles edge cases', () => {
      expect(sanitizeSolanaAddress(null as any)).toBe('');
      expect(sanitizeSolanaAddress(undefined as any)).toBe('');
    });
  });

  describe('sanitizeUri', () => {
    it('validates and sanitizes valid URIs', () => {
      expect(sanitizeUri('https://example.com')).toBe('https://example.com');
      expect(sanitizeUri('http://example.com/path')).toBe(
        'http://example.com/path',
      );
      expect(sanitizeUri('wss://example.com')).toBe('wss://example.com');
    });

    it('rejects invalid URIs', () => {
      expect(sanitizeUri('')).toBe('');
      expect(sanitizeUri('not-a-url')).toBe('');
      expect(sanitizeUri('ftp://example.com')).toBe('');
      // eslint-disable-next-line no-script-url
      expect(sanitizeUri('javascript:alert(1)')).toBe('');
    });

    it('sanitizes URIs with control characters', () => {
      expect(sanitizeUri('https://example.com\n')).toBe('https://example.com');
      expect(sanitizeUri('http://example.com/path\r')).toBe(
        'http://example.com/path',
      );
    });

    it('handles edge cases', () => {
      expect(sanitizeUri(null as any)).toBe('');
      expect(sanitizeUri(undefined as any)).toBe('');
    });
  });

  describe('sanitizeTimestamp', () => {
    it('validates and sanitizes valid timestamps', () => {
      expect(sanitizeTimestamp('2024-01-01T00:00:00.000Z')).toBe(
        '2024-01-01T00:00:00.000Z',
      );
      expect(sanitizeTimestamp('2024-01-01T00:00:00Z')).toBe(
        '2024-01-01T00:00:00Z',
      );
    });

    it('rejects invalid timestamps', () => {
      expect(sanitizeTimestamp('')).toBe('');
      expect(sanitizeTimestamp('not-a-timestamp')).toBe('');
    });

    it('sanitizes timestamps with control characters', () => {
      expect(sanitizeTimestamp('2024-01-01T00:00:00.000Z\n')).toBe(
        '2024-01-01T00:00:00.000Z',
      );
      expect(sanitizeTimestamp('2024-01-01T00:00:00Z\r')).toBe(
        '2024-01-01T00:00:00Z',
      );
    });

    it('handles edge cases', () => {
      expect(sanitizeTimestamp(null as any)).toBe('');
      expect(sanitizeTimestamp(undefined as any)).toBe('');
    });
  });

  describe('sanitizeResources', () => {
    it('validates and sanitizes valid resources', () => {
      const resources = [
        'https://example.com/resource1',
        'https://example.com/resource2',
        'wss://example.com/ws',
      ];
      expect(sanitizeResources(resources)).toStrictEqual(resources);
    });

    it('filters out invalid resources', () => {
      const resources = [
        'https://example.com/valid',
        'invalid-url',
        'https://example.com/valid2',
        'ftp://example.com/invalid',
      ];
      expect(sanitizeResources(resources)).toStrictEqual([
        'https://example.com/valid',
        'https://example.com/valid2',
      ]);
    });

    it('sanitizes resources with control characters', () => {
      const resources = [
        'https://example.com/resource1\n',
        'https://example.com/resource2\r',
        'wss://example.com/ws',
      ];
      expect(sanitizeResources(resources)).toStrictEqual([
        'https://example.com/resource1',
        'https://example.com/resource2',
        'wss://example.com/ws',
      ]);
    });

    it('handles edge cases', () => {
      expect(sanitizeResources([])).toStrictEqual([]);
      expect(sanitizeResources(null as any)).toStrictEqual([]);
      expect(sanitizeResources(undefined as any)).toStrictEqual([]);
    });
  });
});
