import BigNumber from 'bignumber.js';

/**
 * Formats a number as currency.
 *
 * @param amount - The amount of money.
 * @param currency - The currency to format the amount as.
 * @returns The formatted currency string.
 */
export function formatCurrency(amount: string, currency: string): string {
  const bigAmount = new BigNumber(amount);
  const amountNumber = bigAmount.toNumber();

  return amountNumber.toLocaleString('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}
