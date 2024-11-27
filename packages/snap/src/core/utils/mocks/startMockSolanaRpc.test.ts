import { startMockSolanaRpc } from './startMockSolanaRpc';

describe('startMockSolanaRpc', () => {
  let mockRpc: ReturnType<typeof startMockSolanaRpc>;

  beforeAll(() => {
    mockRpc = startMockSolanaRpc();
  });

  afterAll(() => {
    mockRpc.shutdown();
  });

  const makeRpcRequest = async (method: string, params: any[] = []) =>
    fetch('http://localhost:8899', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });

  it('should return a mock RPC interface with expected methods', () => {
    expect(mockRpc).toHaveProperty('mockResolvedResponse');
    expect(mockRpc).toHaveProperty('shutdown');
  });

  it('should return error for unmocked method', async () => {
    const response = await makeRpcRequest('wrongMethod');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(JSON.stringify(body)).toBe(
      JSON.stringify({
        error: {
          code: -32601,
          message: 'No mock registered for this method',
        },
      }),
    );
  });

  it('should return mocked response for registered method', async () => {
    const mockResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: 100000000,
    };

    mockRpc.mockResolvedResponse({
      method: 'getBalance',
      response: mockResponse,
    });

    const response = await makeRpcRequest('getBalance');
    const body = await response.json();
    expect(JSON.stringify(body)).toBe(JSON.stringify(mockResponse));
  });

  it('should handle multiple mock registrations', async () => {
    const mockBalance = {
      jsonrpc: '2.0',
      id: 1,
      result: 100000000,
    };

    const mockBlockHeight = {
      jsonrpc: '2.0',
      id: 1,
      result: 123456,
    };

    mockRpc.mockResolvedResponse({
      method: 'getBalance',
      response: mockBalance,
    });

    mockRpc.mockResolvedResponse({
      method: 'getBlockHeight',
      response: mockBlockHeight,
    });

    const balanceResponse = await makeRpcRequest('getBalance');
    const blockHeightResponse = await makeRpcRequest('getBlockHeight');

    const bodyBalanceResponse = await balanceResponse.json();
    const bodyBlockHeightResponse = await blockHeightResponse.json();

    expect(JSON.stringify(bodyBalanceResponse)).toBe(
      JSON.stringify(mockBalance),
    );
    expect(JSON.stringify(bodyBlockHeightResponse)).toBe(
      JSON.stringify(mockBlockHeight),
    );
  });
});
