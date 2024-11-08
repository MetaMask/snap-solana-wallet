import {
  emitSnapKeyringEvent,
  KeyringEvent,
  SolAccountType,
  type Balance,
  type CaipAssetType,
  type Keyring,
  type KeyringAccount,
  type KeyringRequest,
  type KeyringResponse,
} from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';
import { assert } from 'superstruct';
import { v4 as uuidv4 } from 'uuid';

import { SOL_CAIP_19, SOL_SYMBOL } from '../constants/solana';
import { deriveSolanaAddress } from '../utils/derive-solana-address';
import { getLowestUnusedKeyringAccountIndex } from '../utils/get-lowest-unused-keyring-account-index';
import { getProvider } from '../utils/get-provider';
import logger from '../utils/logger';
import { GetAccounBalancesResponseStruct } from '../validation';
import { SolanaOnChain } from './onchain';
import { SolanaState } from './state';

/**
 * We need to store the index of the KeyringAccount in the state because
 * we want to be able to restore any account with a previously used index.
 */
export type SolanaKeyringAccount = {
  index: number;
} & KeyringAccount;

export class SolanaKeyring implements Keyring {
  readonly #state: SolanaState;

  constructor() {
    this.#state = new SolanaState();
  }

  async listAccounts(): Promise<SolanaKeyringAccount[]> {
    try {
      const currentState = await this.#state.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};

      return Object.values(keyringAccounts).sort((a, b) => a.index - b.index);
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

  async createAccount(
    options?: Record<string, Json>,
  ): Promise<SolanaKeyringAccount> {
    try {
      const keyringAccounts = await this.listAccounts();
      const newAccountIndex =
        getLowestUnusedKeyringAccountIndex(keyringAccounts);
      const newAddress = await deriveSolanaAddress(newAccountIndex);

      if (!newAddress) {
        throw new Error('No address derived');
      }

      logger.log({ newAddress }, 'New address derived');

      const keyringAccount: SolanaKeyringAccount = {
        index: newAccountIndex,
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
        /**
         * We can't pass the `keyringAccount` object because it contains the index
         * and the snaps sdk does not allow extra properties.
         */
        account: {
          type: keyringAccount.type,
          id: keyringAccount.id,
          address: keyringAccount.address,
          options: keyringAccount.options,
          methods: keyringAccount.methods,
        },
        accountNameSuggestion: `Solana Account ${newAccountIndex}`,
      });

      return keyringAccount;
    } catch (error: any) {
      logger.error({ error }, 'Error creating account');
      throw new Error('Error creating account');
    }
  }

  async getAccountBalances(
    id: string,
    assets: CaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    try {
      const account = await this.getAccount(id);
      const balances = new Map<string, string>();

      if (!account) {
        throw new Error('Account not found');
      }

      const onchain = new SolanaOnChain({ cluster: 'devnet' });

      for (const asset of assets) {
        if (asset === SOL_CAIP_19) {
          const balance = await onchain.getBalance(account.address);
          balances.set(asset, balance);
        }
      }

      const response = Object.fromEntries(
        [...balances.entries()].map(([key, value]) => [
          key,
          { amount: value, unit: SOL_SYMBOL },
        ]),
      );

      assert(response, GetAccounBalancesResponseStruct);

      return response;
    } catch (error: any) {
      console.log({ error });
      logger.error({ error }, 'Error getting account balances');
      throw new Error('Error getting account balances');
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

  async deleteAccount(id: string): Promise<void> {
    try {
      await this.#state.update((state) => {
        delete state?.keyringAccounts?.[id];
        return state;
      });
      await this.#emitEvent(KeyringEvent.AccountDeleted, { id });
    } catch (error: any) {
      logger.error({ error }, 'Error deleting account');
      throw new Error('Error deleting account');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async submitRequest(request: KeyringRequest): Promise<KeyringResponse> {
    // TODO: Implement method, this is a placeholder
    return { pending: true };
  }
}
