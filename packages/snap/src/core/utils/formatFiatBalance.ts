import BigNumber from 'bignumber.js';

/**
 * Formats a number to 2 decimal places.
 *
 * @param amount - The amount of money.
 * @returns The formatted string.
 */
export function formatFiatBalance(amount: number | string | BigNumber) {
  const bigAmount = new BigNumber(amount);
  const amountNumber = bigAmount.toNumber().toFixed(2);

  return amountNumber;
}
