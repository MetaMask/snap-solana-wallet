import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
  MOCK_SOLANA_KEYRING_ACCOUNT_5,
} from '../test/mocks/solana-keyring-accounts';
import { getLowestUnusedIndex } from './getLowestUnusedIndex';

describe('getLowestUnusedIndex', () => {
  it('returns 0 when no accounts exist', () => {
    expect(getLowestUnusedIndex([])).toBe(0);
  });

  it('returns 1 when only index 0 is used', () => {
    const accounts = [MOCK_SOLANA_KEYRING_ACCOUNT_0];
    expect(getLowestUnusedIndex(accounts)).toBe(1);
  });

  it('finds gap in sequential indices', () => {
    // Gap at index 2
    const accounts = [
      MOCK_SOLANA_KEYRING_ACCOUNT_0,
      MOCK_SOLANA_KEYRING_ACCOUNT_1,
      MOCK_SOLANA_KEYRING_ACCOUNT_3,
      MOCK_SOLANA_KEYRING_ACCOUNT_4,
    ];
    expect(getLowestUnusedIndex(accounts)).toBe(2);
  });

  it('handles unordered indices', () => {
    const accounts = [
      MOCK_SOLANA_KEYRING_ACCOUNT_3,
      MOCK_SOLANA_KEYRING_ACCOUNT_0,
      MOCK_SOLANA_KEYRING_ACCOUNT_1,
      MOCK_SOLANA_KEYRING_ACCOUNT_4,
    ];
    expect(getLowestUnusedIndex(accounts)).toBe(2);
  });

  it('returns next number after continuous sequence', () => {
    const accounts = [
      MOCK_SOLANA_KEYRING_ACCOUNT_0,
      MOCK_SOLANA_KEYRING_ACCOUNT_1,
      MOCK_SOLANA_KEYRING_ACCOUNT_2,
    ];
    expect(getLowestUnusedIndex(accounts)).toBe(3);
  });

  it('finds first gap with sparse indices', () => {
    const accounts = [
      MOCK_SOLANA_KEYRING_ACCOUNT_0,
      MOCK_SOLANA_KEYRING_ACCOUNT_1,
      MOCK_SOLANA_KEYRING_ACCOUNT_4,
      MOCK_SOLANA_KEYRING_ACCOUNT_5,
    ];
    expect(getLowestUnusedIndex(accounts)).toBe(2);
  });
});
