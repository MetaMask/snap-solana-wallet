import type { Balance } from '@metamask/keyring-api';

import {
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../../../core/constants/solana';
import { SolanaConnection } from '../../../core/services/connection';
import { SolanaKeyring } from '../../../core/services/keyring';
import logger from '../../../core/utils/logger';
// import { getRatesFromMetamask } from '../../../core/utils/interface';
import type { SendContext } from '../types/send';
import { SendCurrency } from '../types/send';

/**
 * Retrieves the send context for a given account and network scope.
 *
 * @param context - The send context.
 * @returns The send context.
 */
export async function getSendContext(
  context: Partial<SendContext>,
): Promise<SendContext> {
  try {
    const keyring = new SolanaKeyring(new SolanaConnection());
    const scope = context?.scope ?? SolanaCaip2Networks.Mainnet;
    const token = `${scope}/${SolanaCaip19Tokens.SOL}`;

    const accounts = await keyring.listAccounts();

    if (!accounts.length) {
      throw new Error('No solana accounts found');
    }

    const result = await Promise.all([
      ...accounts.map(async (account) => {
        const balance = await keyring.getAccountBalances(account.id, [token]);

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
      selectedAccountId: context?.selectedAccountId ?? accounts[0]?.id ?? '',
      currencySymbol: context?.currencySymbol ?? SendCurrency.SOL,
      validation: context.validation ?? {},
      accounts,
      balances,
      rates,
      maxBalance: context?.maxBalance ?? false,
      canReview: context?.canReview ?? false,
      clearToField: context?.clearToField ?? false,
      showClearButton: context?.showClearButton ?? false,
      ...(context ?? {}),
    };
  } catch (error: any) {
    logger.error('Failed to get send context', error);
    throw new Error(error.message);
  }
}
