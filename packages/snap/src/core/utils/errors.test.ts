import { expect } from '@jest/globals';
import { SnapError } from '@metamask/snaps-sdk';

import { withCatchAndThrowSnapError } from './errors';
import logger from './logger';

// Mock the logger to avoid actual console output during tests
jest.mock('./logger', () => ({
  error: jest.fn(),
}));

describe('errors', () => {
  const mockLogger = logger as jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('returns the result when the function succeeds', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withCatchAndThrowSnapError(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('handles and re-throws errors as SnapError', async () => {
      const originalError = new Error('Test error');
      const mockFn = jest.fn().mockRejectedValue(originalError);

      await expect(withCatchAndThrowSnapError(mockFn)).rejects.toThrow(
        SnapError,
      );

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('logs errors with the correct scope and error details', async () => {
      const originalError = new Error('Test error');
      const mockFn = jest.fn().mockRejectedValue(originalError);

      try {
        await withCatchAndThrowSnapError(mockFn);
      } catch (error) {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(SnapError) },
        expect.stringContaining(`[SnapError]`),
      );

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      const logCall = mockLogger.error.mock.calls[0];
      const loggedError = logCall?.[0]?.error;
      expect(loggedError).toBeInstanceOf(SnapError);
    });

    it('handles non-Error objects and converts them to SnapError', async () => {
      const nonErrorValue = 'string error';
      const mockFn = jest.fn().mockRejectedValue(nonErrorValue);

      await expect(withCatchAndThrowSnapError(mockFn)).rejects.toThrow(
        SnapError,
      );

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      const logCall = mockLogger.error.mock.calls[0];
      const loggedError = logCall?.[0]?.error;
      expect(loggedError).toBeInstanceOf(SnapError);
    });

    it('handles null and undefined errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(null);

      await expect(withCatchAndThrowSnapError(mockFn)).rejects.toThrow(
        SnapError,
      );

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('preserves the original error message in the SnapError', async () => {
      const originalError = new Error('Custom error message');
      const mockFn = jest.fn().mockRejectedValue(originalError);

      let caughtError: unknown;
      try {
        await withCatchAndThrowSnapError(mockFn);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(SnapError);
      const snapError = caughtError as SnapError;
      expect(snapError.message).toBe('Custom error message');
    });

    it('handles async functions that return different types', async () => {
      const testCases = [
        { value: 42, type: 'number' },
        { value: { key: 'value' }, type: 'object' },
        { value: [1, 2, 3], type: 'array' },
        { value: true, type: 'boolean' },
        { value: null, type: 'null' },
      ];

      for (const testCase of testCases) {
        const mockFn = jest.fn().mockResolvedValue(testCase.value);

        const result = await withCatchAndThrowSnapError(mockFn);

        expect(result).toBe(testCase.value);
        expect(mockLogger.error).not.toHaveBeenCalled();
      }
    });

    it('handles functions that throw different error types', async () => {
      const errorTypes = [
        new TypeError('Type error'),
        new ReferenceError('Reference error'),
        new RangeError('Range error'),
        new SyntaxError('Syntax error'),
      ];

      for (const errorType of errorTypes) {
        const mockFn = jest.fn().mockRejectedValue(errorType);

        await expect(withCatchAndThrowSnapError(mockFn)).rejects.toThrow(
          SnapError,
        );
      }

      expect(mockLogger.error).toHaveBeenCalledTimes(errorTypes.length);
      const logCalls = mockLogger.error.mock.calls;
      expect(logCalls).toHaveLength(errorTypes.length);

      for (let i = 0; i < errorTypes.length; i++) {
        const logCall = logCalls[i];
        const loggedError = logCall?.[0]?.error;
        expect(loggedError).toBeInstanceOf(SnapError);
        expect(loggedError?.message).toBe(errorTypes[i]?.message);
      }
    });

    it('includes error stack trace in the logged error', async () => {
      const originalError = new Error('Test error');
      originalError.stack = 'Error: Test error\n    at test.js:1:1';
      const mockFn = jest.fn().mockRejectedValue(originalError);

      try {
        await withCatchAndThrowSnapError(mockFn);
      } catch (error) {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(SnapError) },
        expect.stringContaining('[SnapError]'),
      );
    });

    it('handles functions that throw promises', async () => {
      const rejectedPromise = Promise.reject(new Error('Promise error'));
      const mockFn = jest.fn().mockImplementation(async () => rejectedPromise);

      await expect(withCatchAndThrowSnapError(mockFn)).rejects.toThrow(
        SnapError,
      );

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });
  });
});
