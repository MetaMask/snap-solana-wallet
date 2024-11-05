import {
  emitSnapKeyringEvent,
  KeyringEvent,
  SolAccountType,
  type Keyring,
  type KeyringAccount,
  type KeyringRequest,
  type KeyringResponse,
} from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';
import { v4 as uuidv4 } from 'uuid';

import { getProvider } from '../utils/get-provider';
import logger from '../utils/logger';
import { SolanaState } from './state';
import { SolanaWallet } from './wallet';

export class SolanaKeyring implements Keyring {
  readonly #state: SolanaState;

  constructor() {
    this.#state = new SolanaState();
  }

  async listAccounts(): Promise<KeyringAccount[]> {
    // TODO: Implement method, this is a placeholder
    return [];
  }

  async getAccount(id: string): Promise<KeyringAccount | undefined> {
    try {
      const currentState = await this.#state.get();
      const keyringAccounts = currentState?.keyringAccounts ?? [];

      return keyringAccounts?.find((account) => account.id === id);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async createAccount(options?: Record<string, Json>): Promise<KeyringAccount> {
    const solanaWallet = new SolanaWallet(); // TODO: naming

    const currentState = await this.#state.get();
    const keyringAccounts = currentState?.keyringAccounts ?? [];
    const newIndex = keyringAccounts.length;

    const newAddress = await solanaWallet.deriveAddress(newIndex);

    logger.log({ newAddress }, 'New address derived');

    const keyringAccount: KeyringAccount = {
      type: SolAccountType.DataAccount, // TODO: Pending package bump `@metamask/keyring-api`
      id: uuidv4(),
      address: newAddress,
      options: options ?? {},
      methods: [],
    };

    logger.log(
      { keyringAccount },
      `New keyring account created, updating state...`,
    );

    await this.#state.update((state) => {
      return {
        ...state,
        keyringAccounts: [...(state?.keyringAccounts ?? []), keyringAccount],
      };
    });

    logger.log({ keyringAccount }, `State updated with new keyring account`);

    await this.#emitEvent(KeyringEvent.AccountCreated, {
      account: keyringAccount,
      accountNameSuggestion: `Solana Account ${newIndex}`,
    });

    return keyringAccount;
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
