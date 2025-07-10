import { createErrorTrackingTransport } from './errorTrackingTransport';

const mockSnap = {
  request: jest.fn(),
};

describe('createErrorTrackingTransport', () => {
  beforeEach(() => {
    (globalThis as any).snap = mockSnap;
    jest.clearAllMocks();
  });

  describe('HTTP errors (4xx, 5xx)', () => {
    it('should track HTTP 500 errors', async () => {
      const mockTransport = jest
        .fn()
        .mockRejectedValue(new Error('HTTP 500 Internal Server Error'));

      const errorTrackingTransport = createErrorTrackingTransport(
        mockTransport,
        'https://api.example.com',
      );

      await expect(
        errorTrackingTransport({ payload: { method: 'getBalance' } }),
      ).rejects.toThrow('HTTP 500 Internal Server Error');

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackError',
        params: {
          error: expect.objectContaining({
            message: expect.stringContaining('HTTP 500 Internal Server Error'),
          }),
        },
      });
    });

    it('should track network timeout errors', async () => {
      const mockTransport = jest
        .fn()
        .mockRejectedValue(new Error('Network timeout'));

      const errorTrackingTransport = createErrorTrackingTransport(
        mockTransport,
        'https://api.example.com',
      );

      await expect(
        errorTrackingTransport({ payload: { method: 'getBalance' } }),
      ).rejects.toThrow('Network timeout');

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackError',
        params: {
          error: expect.objectContaining({
            message: expect.stringContaining('Network timeout'),
          }),
        },
      });
    });
  });

  describe('JSON-RPC errors in 2xx responses', () => {
    it('should track standard JSON-RPC errors', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32000,
          message: 'RPC error: Invalid request',
        },
      };

      const mockTransport = jest.fn().mockResolvedValue(mockResponse);

      const errorTrackingTransport = createErrorTrackingTransport(
        mockTransport,
        'https://api.example.com',
      );

      await expect(
        errorTrackingTransport({ payload: { method: 'getBalance' } }),
      ).rejects.toThrow(
        'RPC error: {"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"RPC error: Invalid request"}}',
      );

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackError',
        params: {
          error: expect.objectContaining({
            message: expect.stringContaining('RPC error in response'),
          }),
        },
      });
    });

    it('should track Solana RPC errors in result.err', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          err: {
            code: 1,
            message: 'Invalid account',
          },
        },
      };

      const mockTransport = jest.fn().mockResolvedValue(mockResponse);

      const errorTrackingTransport = createErrorTrackingTransport(
        mockTransport,
        'https://api.example.com',
      );

      await expect(
        errorTrackingTransport({ payload: { method: 'getBalance' } }),
      ).rejects.toThrow(
        'RPC error: {"jsonrpc":"2.0","id":1,"result":{"err":{"code":1,"message":"Invalid account"}}}',
      );

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackError',
        params: {
          error: expect.objectContaining({
            message: expect.stringContaining('RPC error in response'),
          }),
        },
      });
    });
  });

  describe('Successful responses', () => {
    it('should not track successful responses', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          value: 1000000,
        },
      };

      const mockTransport = jest.fn().mockResolvedValue(mockResponse);

      const errorTrackingTransport = createErrorTrackingTransport(
        mockTransport,
        'https://api.example.com',
      );

      const result = await errorTrackingTransport({
        payload: { method: 'getBalance' },
      });

      expect(result).toStrictEqual(mockResponse);
      expect(mockSnap.request).not.toHaveBeenCalled();
    });

    it('should not track responses with null result but no error', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: null,
      };

      const mockTransport = jest.fn().mockResolvedValue(mockResponse);

      const errorTrackingTransport = createErrorTrackingTransport(
        mockTransport,
        'https://api.example.com',
      );

      const result = await errorTrackingTransport({
        payload: { method: 'getBalance' },
      });

      expect(result).toStrictEqual(mockResponse);
      expect(mockSnap.request).not.toHaveBeenCalled();
    });
  });

  describe('Error tracking failures', () => {
    it('should handle error tracking failures gracefully', async () => {
      const mockTransport = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));
      mockSnap.request.mockRejectedValue(new Error('Tracking failed'));

      const errorTrackingTransport = createErrorTrackingTransport(
        mockTransport,
        'https://api.example.com',
      );

      await expect(
        errorTrackingTransport({ payload: { method: 'getBalance' } }),
      ).rejects.toThrow('Network error');

      expect(mockSnap.request).toHaveBeenCalled();
    });
  });

  describe('Error information extraction', () => {
    it('should include method and URL in error tracking', async () => {
      const mockTransport = jest
        .fn()
        .mockRejectedValue(new Error('Test error'));

      const errorTrackingTransport = createErrorTrackingTransport(
        mockTransport,
        'https://api.example.com',
      );

      await expect(
        errorTrackingTransport({ payload: { method: 'getBalance' } }),
      ).rejects.toThrow('Test error');

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackError',
        params: {
          error: expect.objectContaining({
            message: expect.stringContaining('"method":"getBalance"'),
          }),
        },
      });
    });

    it('should extract status codes from errors', async () => {
      const mockError = new Error('HTTP 404 Not Found');
      (mockError as any).status = 404;

      const mockTransport = jest.fn().mockRejectedValue(mockError);

      const errorTrackingTransport = createErrorTrackingTransport(
        mockTransport,
        'https://api.example.com',
      );

      await expect(
        errorTrackingTransport({ payload: { method: 'getBalance' } }),
      ).rejects.toThrow('HTTP 404 Not Found');

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackError',
        params: {
          error: expect.objectContaining({
            message: expect.stringContaining('"statusCode":404'),
          }),
        },
      });
    });
  });

  describe('Different error formats', () => {
    it('should handle string errors', async () => {
      const mockTransport = jest.fn().mockRejectedValue('Simple string error');

      const errorTrackingTransport = createErrorTrackingTransport(
        mockTransport,
        'https://api.example.com',
      );

      await expect(
        errorTrackingTransport({ payload: { method: 'getBalance' } }),
      ).rejects.toThrow('Simple string error');

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackError',
        params: {
          error: expect.objectContaining({
            message: expect.stringContaining(
              '"errorMessage":"Simple string error"',
            ),
          }),
        },
      });
    });

    it('should handle objects with error property', async () => {
      const mockError = { error: { code: -32000, message: 'Server error' } };
      const mockTransport = jest.fn().mockRejectedValue(mockError);

      const errorTrackingTransport = createErrorTrackingTransport(
        mockTransport,
        'https://api.example.com',
      );

      await expect(
        errorTrackingTransport({ payload: { method: 'getBalance' } }),
      ).rejects.toThrow('{"code":-32000,"message":"Server error"}');

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackError',
        params: {
          error: expect.objectContaining({
            message: expect.stringContaining(
              '"errorMessage":"{\\"code\\":-32000,\\"message\\":\\"Server error\\"}"',
            ),
          }),
        },
      });
    });
  });
});
