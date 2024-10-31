import type {
  Keyring,
  KeyringAccount,
  KeyringRequest,
  KeyringResponse,
} from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';

import { SolanaState } from './state';

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
    // TODO: Implement method, this is a placeholder
    return {
      type: 'eip155:eoa',
      id: 'new-id',
      address: 'new-address',
      options: {},
      methods: [],
    };
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
