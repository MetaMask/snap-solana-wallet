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
    try {
      const currentState = await this.#state.get();
      return Object.values(currentState?.keyringAccounts ?? {});
    } catch (error: any) {
      logger.error({ error }, 'Error listing accounts');
      throw new Error('Error listing accounts');
    }
  }

  async getAccount(id: string): Promise<KeyringAccount | undefined> {
    try {
      const currentState = await this.#state.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};

      return keyringAccounts?.[id];
    } catch (error: any) {
      logger.error({ error }, 'Error getting account');
      throw new Error('Error getting account');
    }
  }

  async createAccount(options?: Record<string, Json>): Promise<KeyringAccount> {
    try {
      const solanaWallet = new SolanaWallet(); // TODO: naming

      const currentState = await this.#state.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};
      const newIndex = Object.keys(keyringAccounts).length;

      const newAddress = await solanaWallet.deriveAddress(newIndex);

      if (!newAddress) {
        throw new Error('No address derived');
      }

      logger.log({ newAddress }, 'New address derived');

      const keyringAccount: KeyringAccount = {
        type: SolAccountType.DataAccount,
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
          keyringAccounts: {
            ...(state?.keyringAccounts ?? {}),
            [keyringAccount.id]: keyringAccount,
          },
        };
      });

      logger.log({ keyringAccount }, `State updated with new keyring account`);

      await this.#emitEvent(KeyringEvent.AccountCreated, {
        account: keyringAccount,
        accountNameSuggestion: `Solana Account ${newIndex}`,
      });

      return keyringAccount;
    } catch (error: any) {
      logger.error({ error }, 'Error creating account');
      throw new Error('Error creating account');
    }
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
