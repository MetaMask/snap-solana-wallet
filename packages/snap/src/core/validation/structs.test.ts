/* eslint-disable jest/require-to-throw-message */
import { assert, is } from 'superstruct';

import { KnownCaip19Id } from '../constants/solana';
import { Caip19Struct, UrlStruct } from './structs';

describe('structs', () => {
  describe('UrlStruct', () => {
    it('validates valid URLs', () => {
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
        'http://localhost:8899',
      ];

      validUrls.forEach((url) => {
        expect(() => assert(url, UrlStruct)).not.toThrow();
        expect(is(url, UrlStruct)).toBe(true);
      });
    });

    it('rejects invalid URLs', () => {
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
        expect(() => assert(url, UrlStruct)).toThrow();
        expect(is(url, UrlStruct)).toBe(false);
      });
    });

    it('rejects malicious URLs', () => {
      const maliciousUrls = [
        // XSS Attacks
        'https://example.com?<script>alert(1)</script>',
        'https://example.com?<img src="x" onerror="alert(1)">',
        'https://example.com?<iframe src="https://malicious.com"></iframe>',
        'https://example.com?<form action="https://malicious.com"></form>',
        'https://example.com?<object data="https://malicious.com"></object>',
        'https://example.com?<embed src="https://malicious.com"></embed>',
        'https://example.com?<applet code="https://malicious.com"></applet>',
        'https://example.com?<meta http-equiv="refresh" content="0; url=https://malicious.com">',
        'https://example.com?<link rel="stylesheet" href="https://malicious.com">',
        'https://example.com?<style>body{background-image:url(https://malicious.com/image.jpg)}</style>',
        'https://example.com?<script>eval(atob("YWxlcnQoMSk="))</script>',

        // Additional XSS Variants
        'https://example.com?<svg onload="alert(1)">',
        'https://example.com?<img src="javascript:alert(1)">',
        'https://example.com?<a href="javascript:alert(1)">',
        'https://example.com?<div onclick="alert(1)">',

        // SQL Injection Attempts
        'https://example.com?id=1%27%20OR%20%271%27=%271',
        'https://example.com?id=1%20UNION%20SELECT%20*%20FROM%20users',

        // Directory Traversal
        'https://example.com/../../../etc/passwd',
        'https://example.com/..%2f..%2f..%2fetc%2fpasswd',

        // Command Injection
        'https://example.com?cmd=|ls',
        'https://example.com?cmd=;cat%20/etc/passwd',

        // Protocol Pollution
        'https://example.com\\@evil.com',
        'https://example.com%2f@evil.com',
        'https://example.com?url=javascript:alert(1)',

        // Unicode/UTF-8 Attacks
        'https://example.com/％2e％2e/％2e％2e/％2e％2e/etc/passwd',
        'https://example.com/⒕⒖⒗',

        // CRLF Injection
        'https://example.com?%0d%0aContent-Length:%200%0d%0a%0d%0aHTTP/1.1%20200%20OK',

        // Open Redirect
        'https://example.com?redirect=//evil.com',
        'https://example.com?url=https://evil.com',

        // HTML Injection without script tags
        'https://example.com?param=<marquee>test</marquee>',
        'https://example.com?param=<base href="https://evil.com/">',

        // Data URI schemes
        'data:text/html,<script>alert(1)</script>',
        'data:application/x-javascript,alert(1)',

        // Null Byte Attacks
        'https://example.com/file.jpg%00.php',

        // Template Injection
        // eslint-disable-next-line no-template-curly-in-string
        'https://example.com?${7*7}',
        'https://example.com?#{7*7}',
      ];
      maliciousUrls.forEach((url) => {
        expect(() => assert(url, UrlStruct)).toThrow();
        expect(is(url, UrlStruct)).toBe(false);
      });
    });

    describe('Caip19Struct', () => {
      it('validates valid CAIP-19 IDs', () => {
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

      it('rejects invalid CAIP-19 IDs', () => {
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
});
