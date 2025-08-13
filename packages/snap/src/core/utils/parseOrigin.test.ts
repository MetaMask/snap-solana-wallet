import { METAMASK_ORIGIN } from '../constants/solana';
import { parseOrigin } from './parseOrigin';

describe('parseOrigin', () => {
  describe('when origin is MetaMask', () => {
    it('returns "MetaMask" for metamask origin', () => {
      expect(parseOrigin(METAMASK_ORIGIN)).toBe('MetaMask');
    });

    it('returns "MetaMask" for exact string match', () => {
      expect(parseOrigin('metamask')).toBe('MetaMask');
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
    it('throws an error for URLs without protocol', () => {
      expect(() => parseOrigin('//example.com')).toThrow('Invalid URL');
      expect(() => parseOrigin('//www.example.com')).toThrow('Invalid URL');
    });

    it('handles URLs with custom protocols', () => {
      expect(parseOrigin('ftp://example.com')).toBe('example.com');
      expect(parseOrigin('ws://example.com')).toBe('example.com');
      expect(parseOrigin('wss://example.com')).toBe('example.com');
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
    it('throws error for invalid URLs', () => {
      expect(() => parseOrigin('not-a-url')).toThrow('Invalid URL');
      expect(() => parseOrigin('http://')).toThrow('Invalid URL');
      expect(() => parseOrigin('https://')).toThrow('Invalid URL');
      expect(() => parseOrigin('')).toThrow('Invalid URL');
    });

    it('throws error for malformed URLs', () => {
      expect(() => parseOrigin('http://:8080')).toThrow('Invalid URL');
    });
  });
});
