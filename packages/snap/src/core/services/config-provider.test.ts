/* eslint-disable no-restricted-globals */
import { ConfigProvider } from './config-provider';

describe('ConfigProvider', () => {
  let configProvider: ConfigProvider;

  beforeEach(() => {
    configProvider = new ConfigProvider();
    // Clear and reset process.env before each test
    process.env = {};
  });

  describe('get', () => {
    it('should return environment variable value when it exists', () => {
      process.env.TEST_VAR = 'test-value';

      const result = configProvider.get('TEST_VAR');

      expect(result).toBe('test-value');
    });

    it('should return undefined when environment variable does not exist', () => {
      const result = configProvider.get('NON_EXISTENT_VAR');

      expect(result).toBeUndefined();
    });
  });

  describe('safeGet', () => {
    it('should return environment variable value when it exists', () => {
      process.env.TEST_VAR = 'test-value';

      const result = configProvider.safeGet('TEST_VAR');

      expect(result).toBe('test-value');
    });

    it('should throw error when environment variable does not exist', () => {
      expect(() => configProvider.safeGet('NON_EXISTENT_VAR')).toThrow(
        'Environment variable "NON_EXISTENT_VAR" not found',
      );
    });
  });
});
