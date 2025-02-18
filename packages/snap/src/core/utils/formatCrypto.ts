import type BigNumber from 'bignumber.js';

import { formatCryptoBalance } from './formatCryptoBalance';

/**
 * Formats a token amount with commas and a specified symbol.
 *
 * @param amount - The amount of tokens as a BigNumber.
 * @param symbol - The symbol of the token.
 * @param locale - The locale to use for number formatting.
 * @returns The formatted token amount with symbol.
 */
export function formatCrypto(
  amount: number | string | BigNumber,
  symbol: string,
  locale: string,
) {
  const cryptoBalance = formatCryptoBalance(amount, locale);
  return `${cryptoBalance} ${symbol}`;
}
