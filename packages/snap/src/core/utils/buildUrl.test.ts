/* eslint-disable no-script-url */
import { buildUrl } from './buildUrl';

describe('buildUrl', () => {
  it('combines base URL and path correctly', () => {
    const result = buildUrl({
      baseUrl: 'https://api.example.com',
      path: '/users',
    });
    expect(result).toBe('https://api.example.com/users');
  });

  it('adds single query parameter', () => {
    const result = buildUrl({
      baseUrl: 'https://api.example.com',
      path: '/users',
      queryParams: { id: '123' },
    });
    expect(result).toBe('https://api.example.com/users?id=123');
  });

  it('adds multiple query parameters', () => {
    const result = buildUrl({
      baseUrl: 'https://api.example.com',
      path: '/users',
      queryParams: { id: '123', name: 'john', role: 'admin' },
    });
    expect(result).toBe(
      'https://api.example.com/users?id=123&name=john&role=admin',
    );
  });

  it('handles path parameters', () => {
    const result = buildUrl({
      baseUrl: 'https://api.example.com',
      path: '/users/{id}',
      pathParams: { id: '123' },
    });
    expect(result).toBe('https://api.example.com/users/123');
  });

  it('handles trailing slash in base URL', () => {
    const result = buildUrl({
      baseUrl: 'https://api.example.com/',
      path: '/users',
      queryParams: { id: '123' },
    });
    expect(result).toBe('https://api.example.com/users?id=123');
  });

  it('throws error for invalid base URL', () => {
    expect(() =>
      buildUrl({
        baseUrl: 'invalid-url',
        path: '/users',
        queryParams: {},
      }),
    ).toThrow('Invalid URL format');
  });

  // Security validation tests
  it('prevents XSS in query parameters', () => {
    expect(() =>
      buildUrl({
        baseUrl: 'https://api.example.com',
        path: '/search',
        queryParams: {
          q: '<script>alert("xss")</script>',
          callback: 'javascript:alert(1)',
        },
      }),
    ).toThrow('URL contains potentially malicious patterns');
  });

  it('prevents path traversal attacks', () => {
    const result = buildUrl({
      baseUrl: 'https://api.example.com',
      path: '/../../../etc/passwd',
      queryParams: {},
    });
    expect(result).toBe('https://api.example.com/etc/passwd');
  });

  it('handles null and undefined query parameters', () => {
    const result = buildUrl({
      baseUrl: 'https://api.example.com',
      path: '/users',
      queryParams: {
        id: null as unknown as string,
        name: undefined as unknown as string,
        valid: 'data',
      },
    });
    expect(result).toBe('https://api.example.com/users?valid=data');
  });

  it('prevents protocol switching in parameters', () => {
    expect(() =>
      buildUrl({
        baseUrl: 'https://api.example.com',
        path: '/redirect',
        queryParams: {
          url: 'javascript://alert(1)',
          next: 'data:text/html,<script>alert(1)</script>',
        },
      }),
    ).toThrow('URL contains potentially malicious patterns');
  });

  it('handles empty path segments', () => {
    const result = buildUrl({
      baseUrl: 'https://api.example.com',
      path: '//path//to//resource//',
      queryParams: {},
    });
    expect(result).toBe('https://api.example.com/path/to/resource');
  });
});
