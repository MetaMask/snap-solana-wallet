import BigNumber from 'bignumber.js';

import { Networks } from '../../core/constants/solana';
import QUESTION_MARK_SVG from '../../core/img/question-mark.svg';
import { SendCurrencyType, type SendContext } from './types';

/**
 * Register here selectors that return data derived from the context.
 */

export const getTokenAmount = (context: SendContext) => {
  const { amount, tokenPrices, tokenCaipId, currencyType } = context;
  const price = tokenPrices?.[tokenCaipId]?.price;

  if (currencyType === SendCurrencyType.TOKEN) {
    return amount;
  }

  if (price === undefined) {
    throw new Error('Token price is undefined, cannot convert to fiat amount.');
  }

  if (amount === null) {
    return null;
  }

  return BigNumber(amount).dividedBy(BigNumber(price)).toString();
};

export const getSelectedTokenMetadata = (context: SendContext) => {
  const { tokenCaipId, tokenMetadata } = context;

  const metadata = tokenMetadata[tokenCaipId];

  return {
    ...(metadata ?? {}),
    tokenSymbol: metadata?.symbol ?? 'UNKNOWN',
    tokenImage: metadata?.imageSvg ?? QUESTION_MARK_SVG,
  };
};

export const getSelectedTokenPrice = (
  context: SendContext,
): number | undefined => {
  const { tokenCaipId, tokenPrices } = context;
  return tokenPrices?.[tokenCaipId]?.price;
};

export const getNativeTokenPrice = (
  context: SendContext,
): number | undefined => {
  const { tokenPrices, scope } = context;
  return tokenPrices?.[Networks[scope]?.nativeToken?.caip19Id]?.price;
};

export const getBalance = (context: SendContext) => {
  const { balances, fromAccountId, tokenCaipId } = context;
  return balances?.[fromAccountId]?.[tokenCaipId]?.amount ?? '0';
};

export const getIsNativeToken = (context: SendContext) => {
  const { tokenCaipId, scope } = context;
  return tokenCaipId === Networks[scope]?.nativeToken?.caip19Id;
};

export const getNativeTokenBalance = (context: SendContext) => {
  return getBalance({
    ...context,
    tokenCaipId: Networks[context.scope].nativeToken.caip19Id,
  });
};
