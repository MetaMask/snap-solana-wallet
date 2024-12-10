import type { Balance } from '@metamask/keyring-api';

import {
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../../../core/constants/solana';
import { getPreferences } from '../../../core/utils/interface';
import logger from '../../../core/utils/logger';
import { keyring, state } from '../../../snap-context';
import type { SendContext } from '../types';
import { SendCurrency } from '../types';

export const DEFAULT_SEND_CONTEXT: SendContext = {
  scope: SolanaCaip2Networks.Mainnet,
  fromAccountId: '',
  amount: '',
  toAddress: '',
  fee: '0.000005',
  accounts: [],
  currencySymbol: SendCurrency.SOL,
  validation: {},
  balances: {},
  tokenPrices: {
    [SolanaCaip19Tokens.SOL]: {
      price: 0,
      symbol: SolanaCaip19Tokens.SOL,
      caip19Id: SolanaCaip19Tokens.SOL,
      address: '',
      decimals: 0,
    },
  },
  locale: 'en',
  transaction: null,
  stage: 'send-form',
};

/**
 * Retrieves the send context for a given account and network scope.
 * Returns a default context to gracefully handle errors and ensure the interface is rendered.
 *
 * @param scope - The network scope.
 * @param fromAccountId - The account id sending the transaction.
 * @returns The send context.
 */
export async function buildSendContext(
  scope: SolanaCaip2Networks,
  fromAccountId: string,
): Promise<SendContext> {
  try {
    const token = `${scope}/${SolanaCaip19Tokens.SOL}`;
    const stateValue = await state.get();

    const [accounts, preferences] = await Promise.all([
      keyring.listAccounts().catch(() => DEFAULT_SEND_CONTEXT.accounts),
      getPreferences(),
    ]);

    const balances: Record<string, Balance> = {};
    for (const account of accounts) {
      const balance = await keyring
        .getAccountBalances(account.id, [token])
        .catch(() => ({ [token]: { amount: '0', unit: token } }));
      balances[account.id] = balance[token] as Balance;
    }

    return {
      ...DEFAULT_SEND_CONTEXT,
      scope,
      fromAccountId,
      accounts,
      balances,
      tokenPrices: stateValue.tokenPrices,
      locale: preferences.locale,
    };
  } catch (error: any) {
    logger.error('Failed to get send context', error);
    return DEFAULT_SEND_CONTEXT;
  }
}
