import { getAccountIdFromAddress } from './getAccountIdFromAddress';

describe('getAccountIdFromAddress', () => {
  it('should return the account ID if the address is found', () => {
    const accounts = [
      { id: '1', address: '123' },
      { id: '2', address: '456' },
    ];
    const address = '123';

    const result = getAccountIdFromAddress(accounts as any, address);

    expect(result).toBe('1');
  });

  it('should return undefined if the address is not found', () => {
    const accounts = [
      { id: '1', address: '123' },
      { id: '2', address: '456' },
    ];
    const address = '789';

    const result = getAccountIdFromAddress(accounts as any, address);

    expect(result).toBeUndefined();
  });
});
