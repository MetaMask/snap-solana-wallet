/* eslint-disable jest/prefer-strict-equal */
import type {
  MockedRejectedError,
  MockedResolvedResult,
} from './startMockSolanaRpc';
import { startMockSolanaRpc } from './startMockSolanaRpc';

describe('startMockSolanaRpc', () => {
  let mockResolvedResult: (mock: MockedResolvedResult) => void;
  let mockResolvedResultOnce: (mock: MockedResolvedResult) => void;
  let mockRejectedError: (mock: MockedRejectedError) => void;
  let mockRejectedErrorOnce: (mock: MockedRejectedError) => void;
  let shutdown: () => void;

  beforeAll(() => {
    ({
      mockResolvedResult,
      mockResolvedResultOnce,
      mockRejectedError,
      mockRejectedErrorOnce,
      shutdown,
    } = startMockSolanaRpc());
  });

  afterAll(() => {
    shutdown();
  });

  const makeRpcRequest = async (method: string, params: any[] = []) =>
    fetch('http://localhost:8899', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '0',
        method,
        params,
      }),
    });

  it('should return expected methods', () => {
    expect(mockResolvedResult).toBeDefined();
    expect(mockResolvedResultOnce).toBeDefined();
    expect(mockRejectedError).toBeDefined();
    expect(mockRejectedErrorOnce).toBeDefined();
    expect(shutdown).toBeDefined();
  });

  it('should return error for unmocked method', async () => {
    const response = await makeRpcRequest('wrongMethod');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      jsonrpc: '2.0',
      id: '0',
      error: {
        code: -32601,
        message: 'No mock registered for this method',
      },
    });
  });

  it('should return mocked response for registered method', async () => {
    mockResolvedResult({
      method: 'getBalance',
      result: 100000000,
    });

    const response = await makeRpcRequest('getBalance');
    const body = await response.json();
    expect(body).toEqual({
      jsonrpc: '2.0',
      id: '0',
      result: 100000000,
    });
  });

  it('should handle multiple mock registrations', async () => {
    const mockBalance = 100000000;

    const mockBlockHeight = 123456;

    mockResolvedResult({
      method: 'getBalance',
      result: mockBalance,
    });

    mockResolvedResult({
      method: 'getBlockHeight',
      result: mockBlockHeight,
    });

    const balanceResponse = await makeRpcRequest('getBalance');
    const blockHeightResponse = await makeRpcRequest('getBlockHeight');

    const bodyBalanceResponse = await balanceResponse.json();
    const bodyBlockHeightResponse = await blockHeightResponse.json();

    expect(bodyBalanceResponse).toEqual({
      jsonrpc: '2.0',
      id: '0',
      result: mockBalance,
    });
    expect(bodyBlockHeightResponse).toEqual({
      jsonrpc: '2.0',
      id: '0',
      result: mockBlockHeight,
    });
  });

  it('should handle mockResolvedResultOnce correctly', async () => {
    const mockResult = { result: 'test1' };

    mockResolvedResultOnce({
      method: 'testMethod',
      result: mockResult,
    });

    const response1 = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'testMethod' }),
    });

    const data1 = await response1.json();
    expect(data1).toEqual({
      jsonrpc: '2.0',
      id: '0',
      result: mockResult,
    });

    // Second call should fail as the mock was consumed
    const response2 = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'testMethod' }),
    });

    expect(response2.status).toBe(400);
    const data2 = await response2.json();
    expect(data2).toEqual({
      jsonrpc: '2.0',
      id: '0',
      error: {
        code: -32601,
        message: 'No mock registered for this method',
      },
    });
  });

  it('should consume mockResolvedResultOnce calls in LIFO order', async () => {
    const mockResult1 = { result: 'test1' };
    const mockResult2 = { result: 'test2' };

    mockResolvedResultOnce({
      method: 'testMethod',
      result: mockResult1,
    });

    mockResolvedResultOnce({
      method: 'testMethod',
      result: mockResult2,
    });

    // NOTE: We check that the mocks are consumed in LIFO order

    // First call should return mockResponse2
    const response1 = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'testMethod' }),
    });
    const data1 = await response1.json();
    expect(data1).toEqual({
      jsonrpc: '2.0',
      id: '0',
      result: mockResult2,
    });

    // Second call should return mockResponse1
    const response2 = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'testMethod' }),
    });
    const data2 = await response2.json();
    expect(data2).toEqual({
      jsonrpc: '2.0',
      id: '0',
      result: mockResult1,
    });
  });

  it('does not consume mockResolvedResult calls', async () => {
    const oneTimeResult = { result: 'oneTime' };
    const persistentResult = { result: 'persistent' };

    mockResolvedResultOnce({
      method: 'testMethod',
      result: oneTimeResult,
    });

    mockResolvedResult({
      method: 'testMethod',
      result: persistentResult,
    });

    // Both calls should return the persistent response
    const response1 = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'testMethod' }),
    });
    const data1 = await response1.json();
    expect(data1).toEqual({
      jsonrpc: '2.0',
      id: '0',
      result: persistentResult,
    });

    const response2 = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'testMethod' }),
    });
    const data2 = await response2.json();
    expect(data2).toEqual({
      jsonrpc: '2.0',
      id: '0',
      result: persistentResult,
    });
  });

  it('should handle mockRejectedError correctly', async () => {
    const mockError = {
      code: -32000,
      message: 'Test error',
    };

    mockRejectedError({
      method: 'testMethod',
      error: mockError,
    });

    // Multiple calls should return the same error
    for (let i = 0; i < 2; i++) {
      const response = await fetch('http://localhost:8899', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'testMethod' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({
        jsonrpc: '2.0',
        id: '0',
        error: mockError,
      });
    }
  });

  it('should handle mockRejectedErrorOnce correctly', async () => {
    const mockError = {
      code: -32000,
      message: 'One-time error',
    };

    mockRejectedErrorOnce({
      method: 'testMethod-toBeMockedOnce',
      error: mockError,
    });

    // First call should return the error
    const response1 = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'testMethod-toBeMockedOnce' }),
    });

    expect(response1.status).toBe(400);
    const data1 = await response1.json();
    expect(data1).toEqual({
      jsonrpc: '2.0',
      id: '0',
      error: mockError,
    });

    // Second call should return "no mock registered" error
    const response2 = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'testMethod-toBeMockedOnce' }),
    });

    expect(response2.status).toBe(400);
    const data2 = await response2.json();
    expect(data2).toEqual({
      jsonrpc: '2.0',
      id: '0',
      error: {
        code: -32601,
        message: 'No mock registered for this method',
      },
    });
  });

  it('does not consume mockRejectedError calls', async () => {
    const oneTimeError = {
      code: -32000,
      message: 'One-time error',
    };
    const persistentError = {
      code: -32000,
      message: 'Persistent error',
    };

    mockRejectedErrorOnce({
      method: 'testMethod',
      error: oneTimeError,
    });

    mockRejectedError({
      method: 'testMethod',
      error: persistentError,
    });

    // Both calls should return the persistent error
    const response1 = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'testMethod' }),
    });
    const data1 = await response1.json();
    expect(data1).toEqual({
      jsonrpc: '2.0',
      id: '0',
      error: persistentError,
    });

    const response2 = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'testMethod' }),
    });
    const data2 = await response2.json();
    expect(data2).toEqual({
      jsonrpc: '2.0',
      id: '0',
      error: persistentError,
    });
  });
});
