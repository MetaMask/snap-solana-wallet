import type { Json } from '@metamask/snaps-sdk';

import type { SolanaKeyringAccount } from './keyring';

type StateValue = {
  keyringAccounts?: Record<string, SolanaKeyringAccount>;
} | null;

export class SolanaState {
  async get(): Promise<StateValue> {
    const state = await this.#getState();

    return state;
  }

  async set(state: StateValue): Promise<void> {
    await this.#setState(state);
  }

  async update(callback: (state: StateValue) => StateValue): Promise<void> {
    return this.get().then(async (state) => {
      const newState = callback(state);
      return this.set(newState);
    });
  }

  async #getState(): Promise<StateValue> {
    const state = await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'get',
      },
    });

    return state as unknown as StateValue;
  }

  async #setState(state: StateValue): Promise<void> {
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state as unknown as Record<string, Json>,
      },
    });
  }
}
