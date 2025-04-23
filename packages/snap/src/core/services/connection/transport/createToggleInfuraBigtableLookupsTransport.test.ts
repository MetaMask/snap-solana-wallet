import { createDefaultRpcTransport } from '@solana/kit';

import { createToggleInfuraBigtableLookupsTransport } from './createToggleInfuraBigtableLookupsTransports';

// Mock the createDefaultRpcTransport function
jest.mock('@solana/kit', () => ({
  createDefaultRpcTransport: jest.fn(),
}));

describe('createToggleInfuraBigtableLookupsTransport', () => {
  const mockUrl = 'https://test-url.com';
  const mockTransportWithBigtableEnabled = jest.fn();
  const mockTransportWithBigtableDisabled = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createDefaultRpcTransport as jest.Mock).mockImplementation(
      ({ headers }) => {
        if (headers?.['x-bigtable'] === 'disabled') {
          return mockTransportWithBigtableDisabled;
        }
        return mockTransportWithBigtableEnabled;
      },
    );
  });

  it('creates transports with correct configurations', () => {
    createToggleInfuraBigtableLookupsTransport(mockUrl);

    expect(createDefaultRpcTransport).toHaveBeenCalledTimes(2);
    expect(createDefaultRpcTransport).toHaveBeenCalledWith({ url: mockUrl });
    expect(createDefaultRpcTransport).toHaveBeenCalledWith({
      url: mockUrl,
      headers: { 'x-bigtable': 'disabled' },
    });
  });

  it('uses default transport for methods that need BigTable lookups', async () => {
    const transport = createToggleInfuraBigtableLookupsTransport(mockUrl);
    const mockResponse = { result: 'test' };
    mockTransportWithBigtableEnabled.mockResolvedValue(mockResponse);

    const result = await transport({
      payload: { method: 'getTransaction' },
    });

    expect(mockTransportWithBigtableEnabled).toHaveBeenCalled();
    expect(mockTransportWithBigtableDisabled).not.toHaveBeenCalled();
    expect(result).toBe(mockResponse);
  });

  it('uses transport with disabled BigTable lookups for methods that do not need BigTable lookups', async () => {
    const transport = createToggleInfuraBigtableLookupsTransport(mockUrl);
    const mockResponse = { result: 'test' };
    mockTransportWithBigtableDisabled.mockResolvedValue(mockResponse);

    const result = await transport({
      payload: { method: 'getBalance' },
    });

    expect(mockTransportWithBigtableDisabled).toHaveBeenCalled();
    expect(mockTransportWithBigtableEnabled).not.toHaveBeenCalled();
    expect(result).toBe(mockResponse);
  });

  it('handles all methods that need BigTable lookups', async () => {
    const transport = createToggleInfuraBigtableLookupsTransport(mockUrl);
    const methods = ['getTransaction', 'getSignaturesForAddress'];

    for (const method of methods) {
      await transport({
        payload: { method },
      });
      expect(mockTransportWithBigtableEnabled).toHaveBeenCalled();
    }
  });
});
