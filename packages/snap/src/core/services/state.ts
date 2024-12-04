import type { CurrencyRate, Json } from '@metamask/snaps-sdk';

import { SOL_SYMBOL } from '../constants/solana';
import { safeMerge } from '../utils/safe-merge';
import type { SolanaKeyringAccount } from './keyring';

export type StateValue = {
  keyringAccounts?: Record<string, SolanaKeyringAccount>;
  mapInterfaceNameToId: Record<string, string>;
  /** Maps currency symbols to their currency rate */
  currencyRates: Record<string, CurrencyRate>;
};

const NULL_SOL_RATE: CurrencyRate = {
  currency: SOL_SYMBOL,
  conversionRate: 0,
  conversionDate: 0,
};

const DEFAULT_CURRENCY_RATES: Record<string, CurrencyRate> = {
  [SOL_SYMBOL]: NULL_SOL_RATE,
};

export const DEFAULT_STATE: StateValue = {
  keyringAccounts: {},
  mapInterfaceNameToId: {},
  currencyRates: DEFAULT_CURRENCY_RATES,
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
