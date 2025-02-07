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

  it('handles parameters with special characters', () => {
    const result = buildUrl({
      baseUrl: 'https://api.example.com',
      path: '/search',
      queryParams: { q: 'hello world', tag: '@user' },
    });
    expect(result).toBe(
      'https://api.example.com/search?q=hello+world&tag=%40user',
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
    ).toThrow(/Expected a string matching/u);
  });

  // Security validation tests
  it('prevents XSS in query parameters', () => {
    const result = buildUrl({
      baseUrl: 'https://api.example.com',
      path: '/search',
      queryParams: {
        q: '<script>alert("xss")</script>',
        callback: 'javascript:alert(1)',
      },
    });
    expect(result).toBe(
      'https://api.example.com/search?q=%3Cscript%3Ealert%28%22xss%22%29%3C%2Fscript%3E&callback=javascript%3Aalert%281%29',
    );
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
    const result = buildUrl({
      baseUrl: 'https://api.example.com',
      path: '/redirect',
      queryParams: {
        url: 'javascript://alert(1)',
        next: 'data:text/html,<script>alert(1)</script>',
      },
    });
    expect(result).toBe(
      'https://api.example.com/redirect?url=javascript%3A%2F%2Falert%281%29&next=data%3Atext%2Fhtml%2C%3Cscript%3Ealert%281%29%3C%2Fscript%3E',
    );
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
