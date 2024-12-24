import { BigNumber } from 'bignumber.js';

/**
 * Parses a string amount into units based on the provided decimals.
 *
 * @param amount - The amount to be parsed.
 * @param decimals - The number of decimal places.
 * @returns The parsed amount in units.
 */
export function parseUnits(
  amount: string | BigNumber,
  decimals: number,
): string {
  const amountBigNumber = new BigNumber(amount);
  const divisor = new BigNumber(10).pow(decimals);
  const amountUnits = amountBigNumber.div(divisor);

  return amountUnits.toString();
}
