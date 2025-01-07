/**
 * Formats a token amount with commas and a specified symbol.
 *
 * @param amount - The amount of tokens as a string.
 * @param symbol - The symbol of the token.
 * @returns The formatted token amount with symbol.
 */
export function formatTokens(amount: string, symbol: string) {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    throw new Error('Invalid token amount');
  }

  const formattedAmount = numericAmount
    .toFixed(4)
    .replace(/\d(?=(\d{3})+\.)/gu, '$&,');

  return `${formattedAmount} ${symbol}`;
}
