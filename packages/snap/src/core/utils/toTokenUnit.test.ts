import BigNumber from 'bignumber.js';

import { toTokenUnits } from './toTokenUnit';

describe('toTokenUnits', () => {
  it('converts string amounts correctly', () => {
    expect(toTokenUnits('1', 6)).toBe(1000000n);
    expect(toTokenUnits('0.1', 6)).toBe(100000n);
    expect(toTokenUnits('0.000001', 6)).toBe(1n);
  });

  it('converts number amounts correctly', () => {
    expect(toTokenUnits(1, 6)).toBe(1000000n);
    expect(toTokenUnits(0.1, 6)).toBe(100000n);
  });

  it('converts BigNumber amounts correctly', () => {
    expect(toTokenUnits(new BigNumber('1'), 6)).toBe(1000000n);
    expect(toTokenUnits(new BigNumber('0.1'), 6)).toBe(100000n);
  });

  it('converts bigint amounts correctly', () => {
    expect(toTokenUnits(1n, 6)).toBe(1000000n);
  });

  it('handles zero correctly', () => {
    expect(toTokenUnits('0', 6)).toBe(0n);
    expect(toTokenUnits(0, 6)).toBe(0n);
    expect(toTokenUnits(new BigNumber(0), 6)).toBe(0n);
    expect(toTokenUnits(0n, 6)).toBe(0n);
  });

  it('throws error for negative amounts', () => {
    expect(() => toTokenUnits('-1', 6)).toThrow(
      'Token amount cannot be negative',
    );
    expect(() => toTokenUnits(-1, 6)).toThrow(
      'Token amount cannot be negative',
    );
    expect(() => toTokenUnits(new BigNumber(-1), 6)).toThrow(
      'Token amount cannot be negative',
    );
  });

  it('throws error for too many decimal places', () => {
    expect(() => toTokenUnits('0.0000001', 6)).toThrow(
      'Token amount has too many decimal places',
    );
    expect(() => toTokenUnits(0.0000001, 6)).toThrow(
      'Token amount has too many decimal places',
    );
  });
});
