/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  Balance,
  CaipAssetType,
  Transaction,
} from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';

import type { SpotPrices } from '../../clients/price-api/types';
import type { SolanaTokenMetadata } from '../../clients/token-metadata-client/types';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import { safeMerge } from '../../utils/safeMerge';

export type AccountId = string;

export type EncryptedStateValue = {
  keyringAccounts: Record<string, SolanaKeyringAccount>;
  mapInterfaceNameToId: Record<string, string>;
  isFetchingTransactions: boolean;
  transactions: Record<AccountId, Transaction[]>;
  isFetchingAssets: boolean;
  assets: Record<AccountId, Record<CaipAssetType, Balance>>;
  metadata: Record<CaipAssetType, SolanaTokenMetadata>;
  tokenPrices: SpotPrices;
};

export const DEFAULT_ENCRYPTED_STATE: EncryptedStateValue = {
  keyringAccounts: {},
  mapInterfaceNameToId: {},
  isFetchingTransactions: false,
  transactions: {},
  isFetchingAssets: false,
  assets: {},
  metadata: {},
  tokenPrices: {},
};

export class EncryptedState {
  async get(): Promise<EncryptedStateValue> {
    const state = await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'get',
        encrypted: true, // Is the default value, but we're being explicit here.
      },
    });

    // Merge the default state with the underlying snap state
    // to ensure that we always have default values. It lets us avoid a ton of null checks everywhere.
    return safeMerge(DEFAULT_ENCRYPTED_STATE, state ?? {});
  }

  async set(state: EncryptedStateValue): Promise<void> {
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state as unknown as Record<string, Json>,
        encrypted: true, // Is the default value, but we're being explicit here.
      },
    });
  }

  async update(
    callback: (state: EncryptedStateValue) => EncryptedStateValue,
  ): Promise<void> {
    return this.get().then(async (state) => {
      const newState = callback(state);
      return this.set(newState);
    });
  }
}
