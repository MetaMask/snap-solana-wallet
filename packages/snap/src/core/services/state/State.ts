/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Transaction, Balance } from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';

import type { SpotPriceResponse } from '../../clients/price-api/types';
import { safeMerge } from '../../utils/safeMerge';

export type AccountId = string;

export type StateValue = {
  mapInterfaceNameToId: Record<string, string>;
  isFetchingTransactions: boolean;
  transactions: Record<AccountId, Transaction[]>;
  isFetchingAssets: boolean;
  assets: Record<AccountId, Record<string, Balance>>;
};

export const DEFAULT_STATE: StateValue = {
  mapInterfaceNameToId: {},
  isFetchingTransactions: false,
  transactions: {},
  isFetchingAssets: false,
  assets: {},
};

export class SolanaState {
  async get(): Promise<StateValue> {
    const state = await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'get',
        encrypted: false,
      },
    });

    // Merge the default state with the underlying snap state
    // to ensure that we always have default values. It lets us avoid a ton of null checks everywhere.
    return safeMerge(DEFAULT_STATE, state ?? {});
  }

  async set(state: StateValue): Promise<void> {
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state as unknown as Record<string, Json>,
        encrypted: false,
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
