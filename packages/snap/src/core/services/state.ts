/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Json } from '@metamask/snaps-sdk';

import type { TokenInfo } from '../constants/solana';
import { SolanaCaip19Tokens, SolanaTokens } from '../constants/solana';
import { safeMerge } from '../utils/safe-merge';
import type { SolanaKeyringAccount } from './keyring';

export type TokenPrice = TokenInfo & {
  price: number;
};

export type StateValue = {
  keyringAccounts?: Record<string, SolanaKeyringAccount>;
  mapInterfaceNameToId: Record<string, string>;
  tokenPrices: Record<SolanaCaip19Tokens, TokenPrice>; // Maps currency caip19 id to their currency rate
};

const NULL_SOL_PRICE: TokenPrice = {
  ...SolanaTokens[SolanaCaip19Tokens.SOL],
  price: 0,
};

const DEFAULT_TOKEN_PRICES: Record<SolanaCaip19Tokens, TokenPrice> = {
  [SolanaCaip19Tokens.SOL]: NULL_SOL_PRICE,
};

export const DEFAULT_STATE: StateValue = {
  keyringAccounts: {},
  mapInterfaceNameToId: {},
  tokenPrices: DEFAULT_TOKEN_PRICES,
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
    // to ensure that we always have default values. It lets us avoid a ton of null checks everywhere.
    return safeMerge(DEFAULT_STATE, state ?? {});
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
