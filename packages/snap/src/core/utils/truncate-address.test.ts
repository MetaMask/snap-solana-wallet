import { truncateAddress } from './truncate-address';

describe('truncateAddress', () => {
  it('truncates a long address correctly', () => {
    const address = '1234567890abcdef';
    const truncated = truncateAddress(address);
    expect(truncated).toBe('123456...cdef');
  });

  it('handles empty addresses gracefully', () => {
    const address = '';
    const truncated = truncateAddress(address);
    expect(truncated).toBe('');
  });

  it('handles short addresses', () => {
    const address = '123456';
    const truncated = truncateAddress(address);
    expect(truncated).toBe('');
  });

  it('handles addresses with more than 10 characters', () => {
    const address = '12345678900';
    const truncated = truncateAddress(address);
    expect(truncated).toBe('123456...8900');
  });
});
