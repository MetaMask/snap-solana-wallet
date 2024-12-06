import type { Balance } from '@metamask/keyring-api';

import {
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../../../core/constants/solana';
import { getPreferences } from '../../../core/utils/interface';
import logger from '../../../core/utils/logger';
import { state, type SnapExecutionContext } from '../../../snap-context';
import type { SendContext } from '../views/Send/types';
import { SendCurrency } from '../views/Send/types';

/**
 * Retrieves the send context for a given account and network scope.
 *
 * @param context - The send context.
 * @param snapContext - The snap execution context.
 * @returns The send context.
 */
export async function getSendContext(
  context: Partial<SendContext>,
  snapContext: SnapExecutionContext,
): Promise<SendContext> {
  try {
    const scope = context?.scope ?? SolanaCaip2Networks.Mainnet;
    const token = `${scope}/${SolanaCaip19Tokens.SOL}`;
    const stateValue = await state.get();

    const [accounts, preferences] = await Promise.all([
      snapContext.keyring.listAccounts(),
      getPreferences(),
    ]);

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

    return {
      scope,
      fromAccountId: context?.fromAccountId ?? accounts[0]?.id ?? '',
      amount: context?.amount ?? '',
      toAddress: context?.toAddress ?? '',
      fee: '0.000005',
      accounts,
      currencySymbol: context?.currencySymbol ?? SendCurrency.SOL,
      validation: context.validation ?? {},
      balances,
      tokenPrices: stateValue.tokenPrices,
      locale: preferences.locale,
      transaction: context.transaction ?? null,
      stage: context.stage ?? 'send-form',
      ...(context ?? {}),
    };
  } catch (error: any) {
    logger.error('Failed to get send context', error);
    throw new Error(error.message);
  }
}
