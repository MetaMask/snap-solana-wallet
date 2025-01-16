import BigNumber from 'bignumber.js';

/**
 * Converts a human-readable token amount to raw token units.
 * @param amount - The amount in token (e.g., "0.1").
 * @param decimals - The number of decimals the token has (e.g., 6 for USDC).
 * @returns The amount in raw units.
 * @throws If the amount is negative or would result in an underflow.
 */
export function toTokenUnits(
  amount: string | number | bigint | BigNumber,
  decimals: number,
): bigint {
  const bn = new BigNumber(amount.toString());

  if (bn.isNegative()) {
    throw new Error('Token amount cannot be negative');
  }

  const result = bn.times(10 ** decimals).integerValue(BigNumber.ROUND_DOWN);

  return BigInt(result.toString());
}
