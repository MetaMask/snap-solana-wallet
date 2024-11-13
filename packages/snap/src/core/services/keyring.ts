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
  SolMethod,
} from '@metamask/keyring-api';
import { MethodNotFoundError, type Json } from '@metamask/snaps-sdk';
import { assert } from 'superstruct';
import { v4 as uuidv4 } from 'uuid';

import { SOL_CAIP_19, SOL_SYMBOL } from '../constants/solana';
import { getLowestUnusedKeyringAccountIndex } from '../utils/get-lowest-unused-keyring-account-index';
import { getProvider } from '../utils/get-provider';
import logger from '../utils/logger';
import { GetAccounBalancesResponseStruct } from '../validation';
import { SolanaState } from './state';
import { deriveSolanaKeypair } from '../utils/derive-solana-keypair';
import { RpcConnection } from './rpc-connection';
import { CAIP2_TO_SOLANA_CLUSTER } from '../constants/caip2-to-solana-cluster';

/**
 * We need to store the index of the KeyringAccount in the state because
 * we want to be able to restore any account with a previously used index.
 */
export type SolanaKeyringAccount = {
  index: number;
  secretKey: number[];
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

  async getAccount(id: string): Promise<SolanaKeyringAccount | undefined> {
    try {
      const currentState = await this.#state.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};

      return keyringAccounts?.[id];
    } catch (error: any) {
      logger.error({ error }, 'Error getting account'); // TODO: This can only fail in one way. Failed to read the state.
      throw new Error('Error getting account');
    }
  }

  async createAccount(
    options?: Record<string, Json>,
  ): Promise<SolanaKeyringAccount> {
    try {
      const id = uuidv4();
      const keyringAccounts = await this.listAccounts();
      const index = getLowestUnusedKeyringAccountIndex(keyringAccounts);

      const keypair = await deriveSolanaKeypair(index);
      const secretKey = Array.from(keypair.secretKey);

      const address = keypair.publicKey.toBase58();

      const keyringAccount: SolanaKeyringAccount = {
        id,
        index,
        secretKey,
        type: SolAccountType.DataAccount,
        address,
        options: options ?? {},
        methods: [`${SolMethod.SendAndConfirmTransaction}`],
      };

      logger.log(
        { keyringAccount },
        `New keyring account object created, sending it to the extension...`,
      );

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
        accountNameSuggestion: `Solana Account ${index + 1}`,
      });

      logger.log(
        `Account created in the extension, now updating the snap state...`,
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

      const rpcConnection = new RpcConnection({ cluster: 'devnet' });

      for (const asset of assets) {
        if (asset === SOL_CAIP_19) {
          const balance = await rpcConnection.getBalance(account.address);
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

  async submitRequest(request: KeyringRequest): Promise<KeyringResponse> {
    // method: 'keyring_submitRequest',
    // {
    //   id: uuidV4(),
    //   account,
    //   scope: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    //   request: {
    //     method: `${SolMethod.SendAndConfirmTransaction}`,
    //     params: {
    //       to: SOL_ADDRESS,
    //       amount: '0.00000500', solana amount
    //     },
    //   },
    // },

    const { scope, account: accountId } = request;
    const { method, params } = request.request;
    console.log({ scope, accountId, method, params });

    const account = await this.getAccount(accountId);
    console.log({ account });

    if (!account) {
      throw new Error('Account not found');
    }

    switch (method) {
      case `${SolMethod.SendAndConfirmTransaction}`: {
        const cluster = CAIP2_TO_SOLANA_CLUSTER[scope];

        if (!cluster) {
          throw new Error(`Unrecognized scope: ${scope}`);
        }

        if (!params) {
          throw new Error(`Method ${method} called without params`);
        }

        if (!('to' in params)) {
          throw new Error('Missing required parameter: to');
        }

        if (!('amount' in params)) {
          throw new Error('Missing required parameter: amount');
        }

        const from = Keypair.fromSecretKey(Uint8Array.from(account.secretKey));
        const to = new PublicKey(String(params.to));
        const amount = Number(params.amount);

        console.log('Sending transaction...');

        const rpcConnection = new RpcConnection({ cluster });
        const signature = await rpcConnection.transferSol(from, to, amount);

        console.log(`Transaction sent, signature: ${signature}`);

        return { pending: false, result: signature };
      }
      default:
        throw new MethodNotFoundError() as Error;
    }
  }
}
