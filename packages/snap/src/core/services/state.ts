/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { CurrencyRate, Json } from '@metamask/snaps-sdk';

import type { TokenInfo } from '../constants/solana';
import { SOL_SYMBOL, SolanaTokens } from '../constants/solana';
import { safeMerge } from '../utils/safe-merge';
import type { SolanaKeyringAccount } from './keyring';

export type TokenRate = TokenInfo & CurrencyRate;

export type StateValue = {
  keyringAccounts?: Record<string, SolanaKeyringAccount>;
  mapInterfaceNameToId: Record<string, string>;
  tokenRates: Record<string, TokenRate>; // Maps currency symbols to their currency rate
};

const NULL_SOL_RATE: TokenRate = {
  ...SolanaTokens.SOL,
  currency: SolanaTokens.SOL.symbol,
  conversionRate: 0,
  conversionDate: 0,
};

const DEFAULT_TOKEN_RATES: Record<string, TokenRate> = {
  [SOL_SYMBOL]: NULL_SOL_RATE,
};

export const DEFAULT_STATE: StateValue = {
  keyringAccounts: {},
  mapInterfaceNameToId: {},
  tokenRates: DEFAULT_TOKEN_RATES,
};

export class SolanaState {
  async get(): Promise<StateValue> {
    const state = await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'get',
      },
    });

    // Merge the default state with the underlying snap state
    // to ensure that we always have default values and avoid null checks everywhere.
    return safeMerge(DEFAULT_STATE, state as StateValue);
  }

  async set(state: StateValue): Promise<void> {
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state as unknown as Record<string, Json>,
      },
    });
  }

  async update(callback: (state: StateValue) => StateValue): Promise<void> {
    return this.get().then(async (state) => {
      const newState = callback(state);
      return this.set(newState);
    });
  }
}
