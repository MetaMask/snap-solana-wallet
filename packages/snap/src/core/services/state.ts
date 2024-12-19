/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Transaction } from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';

import type { TokenInfo } from '../constants/solana';
import { Caip19Id, TokenMetadata } from '../constants/solana';
import { safeMerge } from '../utils/safe-merge';

export type TokenPrice = TokenInfo & {
  price: number;
};

export type StateValue = {
  mapInterfaceNameToId: Record<string, string>;
  tokenPrices: Record<Caip19Id, TokenPrice>; // Maps currency caip19 id to their currency rate
  isFetchingTransactions: boolean;
  transactions: Record<string, Transaction[]>;
};

export const DEFAULT_TOKEN_PRICES: Record<Caip19Id, TokenPrice> = {
  [Caip19Id.SolMainnet]: {
    ...TokenMetadata[Caip19Id.SolMainnet],
    price: 0,
  },
  [Caip19Id.SolDevnet]: {
    ...TokenMetadata[Caip19Id.SolDevnet],
    price: 0,
  },
  [Caip19Id.SolTestnet]: {
    ...TokenMetadata[Caip19Id.SolTestnet],
    price: 0,
  },
  [Caip19Id.SolLocalnet]: {
    ...TokenMetadata[Caip19Id.SolLocalnet],
    price: 0,
  },
  [Caip19Id.UsdcMainnet]: {
    ...TokenMetadata[Caip19Id.UsdcMainnet],
    price: 0,
  },
  [Caip19Id.UsdcDevnet]: {
    ...TokenMetadata[Caip19Id.UsdcDevnet],
    price: 0,
  },
  [Caip19Id.EurcMainnet]: {
    ...TokenMetadata[Caip19Id.EurcMainnet],
    price: 0,
  },
  [Caip19Id.EurcDevnet]: {
    ...TokenMetadata[Caip19Id.EurcDevnet],
    price: 0,
  },
};

export const DEFAULT_STATE: StateValue = {
  mapInterfaceNameToId: {},
  tokenPrices: DEFAULT_TOKEN_PRICES,
  isFetchingTransactions: false,
  transactions: {},
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
