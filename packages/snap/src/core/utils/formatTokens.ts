type FormatTokensOptions = {
  minimumFractionDigits: number;
  maximumFractionDigits: number;
};

const FORMAT_TOKENS_DEFAULT_OPTIONS: FormatTokensOptions = {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
};

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

  const formattedAmount = numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: FORMAT_TOKENS_DEFAULT_OPTIONS.minimumFractionDigits,
    maximumFractionDigits: FORMAT_TOKENS_DEFAULT_OPTIONS.maximumFractionDigits,
  });

  return `${formattedAmount} ${symbol}`;
}
