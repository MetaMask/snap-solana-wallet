import BigNumber from 'bignumber.js';

/**
 * Converts a token amount to fiat currency using the provided conversion rate.
 * @param tokenAmount - The amount of tokens to convert.
 * @param rateConversion - The conversion rate from token to fiat.
 * @returns The fiat value of the token amount.
 */
export function tokenToFiat(tokenAmount: string, rateConversion: number) {
  const bigAmount = new BigNumber(tokenAmount);
  return bigAmount.multipliedBy(rateConversion).toString();
}
