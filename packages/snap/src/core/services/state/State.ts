/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  Balance,
  CaipAssetType,
  Transaction,
} from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';

import type { SpotPrices } from '../../clients/price-api/types';
import type { SolanaTokenMetadata } from '../../clients/token-metadata-client/types';
import { safeMerge } from '../../utils/safeMerge';

export type AccountId = string;

export type StateValue = {
  mapInterfaceNameToId: Record<string, string>;
  transactions: Record<AccountId, Transaction[]>;
  assets: Record<AccountId, Record<CaipAssetType, Balance>>;
  metadata: Record<CaipAssetType, SolanaTokenMetadata>;
  tokenPrices: SpotPrices;
};

export const DEFAULT_STATE: StateValue = {
  mapInterfaceNameToId: {},
  transactions: {},
  assets: {},
  metadata: {},
  tokenPrices: {},
};

export class State {
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
