import type { SolanaKeyringAccount } from '../services/keyring';
import { getLowestUnusedKeyringAccountIndex } from './get-lowest-unused-keyring-account-index';

const createMockAccount = (index: number): SolanaKeyringAccount => ({
  index,
  id: `id-${index}`,
  type: 'solana:data-account',
  address: `address-${index}`,
  options: {},
  methods: [],
});

describe('getLowestUnusedKeyringAccountIndex', () => {
  it('returns 0 when no accounts exist', () => {
    expect(getLowestUnusedKeyringAccountIndex([])).toBe(0);
  });

  it('returns 1 when only index 0 is used', () => {
    const accounts = [createMockAccount(0)];
    expect(getLowestUnusedKeyringAccountIndex(accounts)).toBe(1);
  });

  it('finds gap in sequential indices', () => {
    const accounts = [
      createMockAccount(0),
      createMockAccount(1),
      createMockAccount(3), // Gap at index 2
      createMockAccount(4),
    ];
    expect(getLowestUnusedKeyringAccountIndex(accounts)).toBe(2);
  });

  it('handles unordered indices', () => {
    const accounts = [
      createMockAccount(3),
      createMockAccount(0),
      createMockAccount(1),
      createMockAccount(4),
    ];
    expect(getLowestUnusedKeyringAccountIndex(accounts)).toBe(2);
  });

  it('returns next number after continuous sequence', () => {
    const accounts = [
      createMockAccount(0),
      createMockAccount(1),
      createMockAccount(2),
    ];
    expect(getLowestUnusedKeyringAccountIndex(accounts)).toBe(3);
  });

  it('finds first gap with sparse indices', () => {
    const accounts = [
      createMockAccount(0),
      createMockAccount(1),
      createMockAccount(5),
      createMockAccount(8),
    ];
    expect(getLowestUnusedKeyringAccountIndex(accounts)).toBe(2);
  });
});
