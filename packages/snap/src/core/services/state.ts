import { KeyringAccount } from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';

type StateValue = {
  keyringAccounts: KeyringAccount[];
};

/**
 * One SRP -> Multiple Addresses
 * Each address is a Keyring Account
 * ... One SRP -> Multiple KeyringAccounts
 * ... Each address is KeyringAccount
 */



// type: "eip155:eoa" | "eip155:erc4337" | "bip122:p2wpkh";
// id: string;
// address: string;
// options: Record<string, Json>;
// methods: string[];

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
