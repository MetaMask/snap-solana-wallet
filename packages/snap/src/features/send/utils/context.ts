import type { Balance } from '@metamask/keyring-api';

import {
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../../../core/constants/solana';
import logger from '../../../core/utils/logger';
// import { getRatesFromMetamask } from '../../../core/utils/interface';
import { type SnapExecutionContext } from '../../../index';
import type { SendContext } from '../views/SendForm/types';
import { SendCurrency } from '../views/SendForm/types';

/**
 * Retrieves the send context for a given account and network scope.
 *
 * @param context - The send context.
 * @returns The send context.
 */
export async function getSendContext(
  context: Partial<SendContext>,
  snapContext: SnapExecutionContext,
): Promise<SendContext> {
  try {
    const scope = context?.scope ?? SolanaCaip2Networks.Mainnet;
    const token = `${scope}/${SolanaCaip19Tokens.SOL}`;

    const accounts = await snapContext.keyring.listAccounts();

    if (!accounts.length) {
      throw new Error('No solana accounts found');
    }

    const result = await Promise.all([
      ...accounts.map(async (account) => {
        const balance = await snapContext.keyring.getAccountBalances(
          account.id,
          [token],
        );

        return { accountId: account.id, balance: balance[token] as Balance };
      }),
    ]);

    const balances = result.reduce(
      (list: Record<string, Balance>, { accountId, balance }) => {
        list[accountId] = balance;
        return list;
      },
      {},
    );

    // getRatesFromMetamask(SendCurrency.SOL),
    // TODO: Remove this mock data when the rates are available to fetch.
    const rates = {
      conversionDate: Date.now(),
      conversionRate: 261,
      currency: SendCurrency.FIAT,
      usdConversionRate: 1,
    };

    return {
      scope,
      fromAccountId: context?.fromAccountId ?? accounts[0]?.id ?? '',
      amount: context?.amount ?? '',
      toAddress: context?.toAddress ?? '',
      accounts,
      currencySymbol: context?.currencySymbol ?? SendCurrency.SOL,
      validation: context.validation ?? {},
      balances,
      rates,
      maxBalance: context?.maxBalance ?? false,
      canReview: context?.canReview ?? false,
      ...(context ?? {}),
    };
  } catch (error: any) {
    logger.error('Failed to get send context', error);
    throw new Error(error.message);
  }
}
