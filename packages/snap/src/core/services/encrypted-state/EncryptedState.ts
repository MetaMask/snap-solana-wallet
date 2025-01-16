/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Json } from '@metamask/snaps-sdk';

import { safeMerge } from '../../utils/safeMerge';
import type { SolanaKeyringAccount } from '../keyring/Keyring';

export type EncryptedStateValue = {
  keyringAccounts: Record<string, SolanaKeyringAccount>;
};

export const DEFAULT_ENCRYPTED_STATE: EncryptedStateValue = {
  keyringAccounts: {},
};

export class EncryptedSolanaState {
  async get(): Promise<EncryptedStateValue> {
    const state = await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'get',
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
