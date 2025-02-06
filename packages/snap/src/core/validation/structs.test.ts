import { assert, is } from 'superstruct';

import { KnownCaip19Id } from '../constants/solana';
import { Caip19Struct, UrlStruct } from './structs';

describe('structs', () => {
  describe('UrlStruct', () => {
    it('should validate valid URLs', () => {
      const validUrls = [
        'http://example.com',
        'https://example.com',
        'https://www.example.com',
        'https://sub.example.com',
        'https://example.com/path',
        'https://example.com/path?query=123',
        'https://example.com/path?query=123&other=456',
        'https://example.com:8080',
        'https://example.com/path-with-hyphens',
        'https://example.com/path_with_underscore',
      ];

      validUrls.forEach((url) => {
        expect(() => assert(url, UrlStruct)).not.toThrow();
        expect(is(url, UrlStruct)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'ftp://example.com',
        'example.com',
        'http:/example.com',
        'http://example',
        'http:///example.com',
        'http:// example.com',
        // eslint-disable-next-line no-script-url
        'javascript:alert(1)',
        'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==',
      ];

      invalidUrls.forEach((url) => {
        expect(() => assert(url, UrlStruct)).toThrow(
          /Expected a string matching/u,
        );
        expect(is(url, UrlStruct)).toBe(false);
      });
    });
  });

  describe('Caip19Struct', () => {
    it('should validate valid CAIP-19 IDs', () => {
      const validCaip19Ids = [
        KnownCaip19Id.SolMainnet,
        KnownCaip19Id.SolDevnet,
        KnownCaip19Id.SolTestnet,
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ];

      validCaip19Ids.forEach((caip19Id) => {
        expect(() => assert(caip19Id, Caip19Struct)).not.toThrow();
        expect(is(caip19Id, Caip19Struct)).toBe(true);
      });
    });

    it('should reject invalid CAIP-19 IDs', () => {
      const invalidCaip19Ids = ['bob', 'bob/slip44:501'];

      invalidCaip19Ids.forEach((caip19Id) => {
        expect(() => assert(caip19Id, Caip19Struct)).toThrow(
          /Expected a string matching/u,
        );
        expect(is(caip19Id, Caip19Struct)).toBe(false);
      });
    });
  });
});
