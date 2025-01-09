import BigNumber from 'bignumber.js';

/**
 * Converts raw token units to human-readable format.
 * @param amount - The amount in raw units.
 * @param decimals - The number of decimals the token has.
 * @returns The amount in human-readable format.
 */
export function fromTokenUnits(
  amount: string | number | bigint | BigNumber,
  decimals: number,
): string {
  const bn = new BigNumber(amount.toString());
  return bn.div(10 ** decimals).toFixed(); // Use toFixed to avoid automatic scientific notation like 1e-18
}
