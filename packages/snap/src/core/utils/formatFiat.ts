import BigNumber from 'bignumber.js';

/**
 * Formats a number as currency.
 *
 * @param amount - The amount of money.
 * @param currency - The currency to format the amount as.
 * @param locale - The locale to use for number formatting.
 * @returns The formatted currency string.
 */
export function formatFiat(
  amount: string,
  currency: string,
  locale: string,
): string {
  const bigAmount = new BigNumber(amount);
  const amountNumber = bigAmount.toNumber();
  const [localeCode] = locale.split('_');

  return amountNumber.toLocaleString(localeCode, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}
