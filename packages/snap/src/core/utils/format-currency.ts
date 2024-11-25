import BigNumber from 'bignumber.js';

/**
 * Formats a number as currency.
 *
 * @param amount - The amount of money.
 * @returns The formatted currency string.
 */
export function formatCurrency(amount: string) {
  const bigAmount = new BigNumber(amount);
  const isNegative = bigAmount.isNegative();
  const absoluteAmount = bigAmount.abs();
  const formattedAmount = absoluteAmount
    .toFixed(2)
    .replace(/\d(?=(\d{3})+\.)/gu, '$&,');

  return `${isNegative ? '-' : ''}$${formattedAmount}`;
}
