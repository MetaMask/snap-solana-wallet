import BigNumber from 'bignumber.js';

import { fromTokenUnits } from './fromTokenUnit';

describe('fromTokenUnits', () => {
  it('converts string amount correctly', () => {
    expect(fromTokenUnits('1000000000000000000', 18)).toBe('1');
    expect(fromTokenUnits('1234560000000000000', 18)).toBe('1.23456');
  });

  it('converts number amount correctly', () => {
    expect(fromTokenUnits(1000000, 6)).toBe('1');
    expect(fromTokenUnits(1234560, 6)).toBe('1.23456');
  });

  it('converts BigNumber amount correctly', () => {
    const amount = new BigNumber('1000000000000000000');
    expect(fromTokenUnits(amount, 18)).toBe('1');
  });

  it('converts bigint amount correctly', () => {
    const amount = BigInt('1000000000000000000');
    expect(fromTokenUnits(amount, 18)).toBe('1');
  });

  it('handles zero correctly', () => {
    expect(fromTokenUnits('0', 18)).toBe('0');
    expect(fromTokenUnits(0, 18)).toBe('0');
    expect(fromTokenUnits(new BigNumber(0), 18)).toBe('0');
  });

  it('handles different decimal places', () => {
    expect(fromTokenUnits('1000000', 6)).toBe('1');
    expect(fromTokenUnits('100', 2)).toBe('1');
    expect(fromTokenUnits('1000', 3)).toBe('1');
  });

  it('handles very small numbers', () => {
    expect(fromTokenUnits('1', 18)).toBe('0.000000000000000001');
    expect(fromTokenUnits('10', 18)).toBe('0.00000000000000001');
  });
});
