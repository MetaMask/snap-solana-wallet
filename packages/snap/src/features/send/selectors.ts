import BigNumber from 'bignumber.js';

import SolanaLogo from '../../../images/coin.svg';
import { SendCurrencyType, type SendContext } from './types';

/**
 * Register here selectors that return data derived from the context.
 */

export const getTokenAmount = (context: SendContext) => {
  const { amount, tokenPrices, tokenCaipId, currencyType } = context;
  const { price } = tokenPrices[tokenCaipId] ?? { price: 0 };
  return currencyType === SendCurrencyType.TOKEN
    ? amount
    : BigNumber(amount).dividedBy(BigNumber(price)).toString();
};

export const getSelectedTokenMetadata = (context: SendContext) => {
  const { tokenCaipId, tokenMetadata } = context;

  const metadata = tokenMetadata[tokenCaipId];

  return {
    ...(metadata ?? {}),
    tokenSymbol: metadata?.symbol ?? '',
    tokenImage: metadata?.imageSvg ?? SolanaLogo,
  };
};

export const getSelectedTokenPrice = (context: SendContext) => {
  const { tokenCaipId, tokenPrices } = context;

  return tokenPrices?.[tokenCaipId]?.price ?? 0;
};
