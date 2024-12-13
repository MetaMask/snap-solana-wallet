import BigNumber from 'bignumber.js';

import { SolanaCaip19Tokens } from '../../core/constants/solana';
import { SendCurrency, type SendContext } from './types';

/**
 * Register here selectors that return data derived from the context.
 */

export const getAmountInSol = (context: SendContext) => {
  const { amount, tokenPrices, currencySymbol } = context;
  const { price } = tokenPrices[SolanaCaip19Tokens.SOL];
  return currencySymbol === SendCurrency.SOL
    ? amount
    : BigNumber(amount).dividedBy(BigNumber(price)).toString();
};
