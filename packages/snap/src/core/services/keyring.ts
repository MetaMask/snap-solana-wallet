import {
  emitSnapKeyringEvent,
  KeyringEvent,
  type Keyring,
  type KeyringAccount,
  type KeyringRequest,
  type KeyringResponse,
} from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';
import { v4 as uuidv4 } from 'uuid';

import { SolanaState } from './state';
import { SolanaWallet } from './wallet';
import { getProvider } from '../utils/get-provider';

export class SolanaKeyring implements Keyring {
  readonly #state: SolanaState;

  constructor() {
    this.#state = new SolanaState();
  }

  async listAccounts(): Promise<KeyringAccount[]> {
    // TODO: Implement method, this is a placeholder
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAccount(id: string): Promise<KeyringAccount | undefined> {
    // TODO: Implement method, this is a placeholder
    return {
      type: 'eip155:eoa',
      id: 'default-id',
      address: 'default-address',
      options: {},
      methods: [],
    };
  }

  async createAccount(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: Record<string, Json>,
  ): Promise<KeyringAccount> {
    /**
     * Generate one KeyringAccount (Address) for Solana
     */
    const solanaWallet = new SolanaWallet() // TODO: naming

    const { keyringAccounts } = await this.#state.get()
    const lastIndex = keyringAccounts.length
    const newIndex = lastIndex + 1

    const newKeyringAccount = await solanaWallet.deriveAddress(newIndex)
    
    await this.#state.update((state) => {
      // TODO: newKeyringAccount cannot be a string...
      return { keyringAccounts: [...state.keyringAccounts, newKeyringAccount] }
    })

    await this.#emitEvent(KeyringEvent.AccountCreated, {
      account: newKeyringAccount,
      // TODO: Maybe we need to generate a suggestion here. Let's try first without it.
      // Leave it blank to fallback to auto-suggested name on the extension side
      accountNameSuggestion: `Solana Account ${newIndex}`,
    });

    return {
      type: 'solana:TODO',
      id: uuidv4(),
      address: account.address,
      options: {
        ...options,
      },
      methods: this._methods,
    } as unknown as KeyringAccount;
  }

  async #emitEvent(
    event: KeyringEvent,
    data: Record<string, Json>,
  ): Promise<void> {
    await emitSnapKeyringEvent(getProvider(), event, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async filterAccountChains(id: string, chains: string[]): Promise<string[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateAccount(account: KeyringAccount): Promise<void> {
    // TODO: Implement method, this is a placeholder
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteAccount(id: string): Promise<void> {
    // TODO: Implement method, this is a placeholder
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async submitRequest(request: KeyringRequest): Promise<KeyringResponse> {
    // TODO: Implement method, this is a placeholder
    return { pending: true };
  }
}
