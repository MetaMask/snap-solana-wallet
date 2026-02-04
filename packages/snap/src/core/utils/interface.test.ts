import { expect } from '@jest/globals';

import {
  getInterfaceContextIfExists,
  isInterfaceNotFoundError,
  updateInterfaceIfExists,
} from './interface';

// Mock the snap global
const mockSnapRequest = jest.fn();

Object.defineProperty(globalThis, 'snap', {
  value: {
    request: mockSnapRequest,
  },
  writable: true,
});

describe('interface utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isInterfaceNotFoundError', () => {
    it('returns true for interface not found error', () => {
      const error = new Error("Interface with id 'abc123' not found.");
      expect(isInterfaceNotFoundError(error)).toBe(true);
    });

    it('returns true for interface not found error (case insensitive)', () => {
      const error = new Error("INTERFACE with id 'abc123' NOT FOUND.");
      expect(isInterfaceNotFoundError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error = new Error('Network timeout');
      expect(isInterfaceNotFoundError(error)).toBe(false);
    });

    it('returns false for non-Error objects', () => {
      expect(isInterfaceNotFoundError('string error')).toBe(false);
      expect(isInterfaceNotFoundError(null)).toBe(false);
      expect(isInterfaceNotFoundError(undefined)).toBe(false);
      expect(isInterfaceNotFoundError({ message: 'interface not found' })).toBe(
        false,
      );
    });

    it('returns false for error with only "interface" in message', () => {
      const error = new Error('Invalid interface configuration');
      expect(isInterfaceNotFoundError(error)).toBe(false);
    });

    it('returns false for error with only "not found" in message', () => {
      const error = new Error('Account not found');
      expect(isInterfaceNotFoundError(error)).toBe(false);
    });
  });

  describe('getInterfaceContextIfExists', () => {
    it('returns context when interface exists', async () => {
      const mockContext = { foo: 'bar', count: 42 };
      mockSnapRequest.mockResolvedValue(mockContext);

      const result =
        await getInterfaceContextIfExists<typeof mockContext>(
          'test-interface-id',
        );

      expect(result).toStrictEqual(mockContext);
      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_getInterfaceContext',
        params: { id: 'test-interface-id' },
      });
    });

    it('returns null when rawContext is falsy', async () => {
      mockSnapRequest.mockResolvedValue(null);

      const result = await getInterfaceContextIfExists('test-interface-id');

      expect(result).toBeNull();
    });

    it('returns null when interface is not found', async () => {
      mockSnapRequest.mockRejectedValue(
        new Error("Interface with id 'test-interface-id' not found."),
      );

      const result = await getInterfaceContextIfExists('test-interface-id');

      expect(result).toBeNull();
    });

    it('re-throws non-interface-not-found errors', async () => {
      const networkError = new Error('Network timeout');
      mockSnapRequest.mockRejectedValue(networkError);

      await expect(
        getInterfaceContextIfExists('test-interface-id'),
      ).rejects.toThrow('Network timeout');
    });
  });

  describe('updateInterfaceIfExists', () => {
    it('returns true when interface exists', async () => {
      mockSnapRequest.mockResolvedValue(null);

      const mockUi = { type: 'Box', children: [] };
      const mockContext = { foo: 'bar' };

      const result = await updateInterfaceIfExists(
        'test-interface-id',
        mockUi as any,
        mockContext,
      );

      expect(result).toBe(true);
      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_updateInterface',
        params: {
          id: 'test-interface-id',
          ui: mockUi,
          context: mockContext,
        },
      });
    });

    it('returns null when interface is not found', async () => {
      mockSnapRequest.mockRejectedValue(
        new Error("Interface with id 'test-interface-id' not found."),
      );

      const mockUi = { type: 'Box', children: [] };
      const mockContext = { foo: 'bar' };

      const result = await updateInterfaceIfExists(
        'test-interface-id',
        mockUi as any,
        mockContext,
      );

      expect(result).toBeNull();
    });

    it('re-throws non-interface-not-found errors', async () => {
      const networkError = new Error('Network timeout');
      mockSnapRequest.mockRejectedValue(networkError);

      const mockUi = { type: 'Box', children: [] };
      const mockContext = { foo: 'bar' };

      await expect(
        updateInterfaceIfExists(
          'test-interface-id',
          mockUi as any,
          mockContext,
        ),
      ).rejects.toThrow('Network timeout');
    });
  });
});
