import { isKnownOrigin, parseOrigin } from './parseOrigin';

describe('parseOrigin', () => {
  describe('when origin is a known origin', () => {
    it('returns the MetaMask label for the metamask origin', () => {
      expect(parseOrigin('metamask')).toBe('MetaMask');
    });

    it('returns the WalletConnect label for the wallet-connect origin', () => {
      expect(parseOrigin('wallet-connect')).toBe('WalletConnect');
    });

    it('matches known origins case-insensitively', () => {
      expect(parseOrigin('MetaMask')).toBe('MetaMask');
      expect(parseOrigin('Wallet-Connect')).toBe('WalletConnect');
    });
  });

  describe('when origin is a valid URL', () => {
    it('returns hostname for HTTP URLs', () => {
      expect(parseOrigin('http://example.com')).toBe('example.com');
      expect(parseOrigin('http://www.example.com')).toBe('www.example.com');
      expect(parseOrigin('http://sub.example.com')).toBe('sub.example.com');
    });

    it('returns hostname for HTTPS URLs', () => {
      expect(parseOrigin('https://example.com')).toBe('example.com');
      expect(parseOrigin('https://www.example.com')).toBe('www.example.com');
      expect(parseOrigin('https://sub.example.com')).toBe('sub.example.com');
    });

    it('returns hostname for URLs with paths', () => {
      expect(parseOrigin('https://example.com/path')).toBe('example.com');
      expect(parseOrigin('https://example.com/path/to/resource')).toBe(
        'example.com',
      );
      expect(parseOrigin('https://example.com/path?query=value')).toBe(
        'example.com',
      );
    });

    it('returns hostname for URLs with query parameters', () => {
      expect(parseOrigin('https://example.com?param=value')).toBe(
        'example.com',
      );
      expect(
        parseOrigin('https://example.com/path?param1=value1&param2=value2'),
      ).toBe('example.com');
    });

    it('returns hostname for URLs with fragments', () => {
      expect(parseOrigin('https://example.com#section')).toBe('example.com');
      expect(parseOrigin('https://example.com/path#section')).toBe(
        'example.com',
      );
    });

    it('returns hostname for URLs with ports', () => {
      expect(parseOrigin('https://example.com:8080')).toBe('example.com');
      expect(parseOrigin('http://localhost:3000')).toBe('localhost');
    });

    it('returns hostname for localhost URLs', () => {
      expect(parseOrigin('http://localhost')).toBe('localhost');
      expect(parseOrigin('http://localhost:3000')).toBe('localhost');
      expect(parseOrigin('https://localhost')).toBe('localhost');
    });

    it('returns hostname for IP addresses', () => {
      expect(parseOrigin('http://192.168.1.1')).toBe('192.168.1.1');
      expect(parseOrigin('https://127.0.0.1')).toBe('127.0.0.1');
      expect(parseOrigin('http://192.168.1.1:8080')).toBe('192.168.1.1');
    });
  });

  describe('edge cases', () => {
    it('throws for URLs without protocol', () => {
      expect(() => parseOrigin('//example.com')).toThrow(
        'Invalid origin: //example.com. Must be a valid URL or a known origin.',
      );
      expect(() => parseOrigin('//www.example.com')).toThrow(
        'Invalid origin: //www.example.com. Must be a valid URL or a known origin.',
      );
    });

    it('throws for non-HTTP URLs', () => {
      expect(() => parseOrigin('ftp://example.com')).toThrow(
        'Invalid origin: ftp://example.com. Must be a valid URL or a known origin.',
      );
      expect(() => parseOrigin('ws://example.com')).toThrow(
        'Invalid origin: ws://example.com. Must be a valid URL or a known origin.',
      );
      expect(() => parseOrigin('wss://example.com')).toThrow(
        'Invalid origin: wss://example.com. Must be a valid URL or a known origin.',
      );
    });

    it('handles complex subdomains', () => {
      expect(parseOrigin('https://api.v1.example.com')).toBe(
        'api.v1.example.com',
      );
      expect(parseOrigin('https://dev.staging.example.com')).toBe(
        'dev.staging.example.com',
      );
    });
  });

  describe('error handling', () => {
    it('throws for invalid URLs', () => {
      expect(() => parseOrigin('not-a-url')).toThrow(
        'Invalid origin: not-a-url. Must be a valid URL or a known origin.',
      );
      expect(() => parseOrigin('http://')).toThrow(
        'Invalid origin: http://. Must be a valid URL or a known origin.',
      );
      expect(() => parseOrigin('https://')).toThrow(
        'Invalid origin: https://. Must be a valid URL or a known origin.',
      );
      expect(() => parseOrigin('')).toThrow(
        'Invalid origin: . Must be a valid URL or a known origin.',
      );
    });

    it('throws for malformed URLs', () => {
      expect(() => parseOrigin('http://:8080')).toThrow(
        'Invalid origin: http://:8080. Must be a valid URL or a known origin.',
      );
    });
  });
});

describe('isKnownOrigin', () => {
  it('returns true for the WalletConnect origin', () => {
    expect(isKnownOrigin('wallet-connect')).toBe(true);
    expect(isKnownOrigin('metamask')).toBe(true);
  });

  it('returns false for other origins', () => {
    expect(isKnownOrigin('https://example.com')).toBe(false);
    expect(isKnownOrigin(undefined)).toBe(false);
  });
});
