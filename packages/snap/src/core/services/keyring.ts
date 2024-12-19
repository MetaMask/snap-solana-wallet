/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
import {
  emitSnapKeyringEvent,
  KeyringEvent,
  SolAccountType,
  SolMethod,
  type Balance,
  type CaipAssetType,
  type Keyring,
  type KeyringAccount,
  type KeyringRequest,
  type KeyringResponse,
} from '@metamask/keyring-api';
import { MethodNotFoundError, type Json } from '@metamask/snaps-sdk';
import {
  address,
  createKeyPairFromPrivateKeyBytes,
  getAddressFromPublicKey,
} from '@solana/web3.js';
import type { Struct } from 'superstruct';
import { assert } from 'superstruct';

import {
  SOL_SYMBOL,
  SolanaCaip19Tokens,
  type SolanaCaip2Networks,
} from '../constants/solana';
import { lamportsToSol } from '../utils/conversion';
import { deriveSolanaPrivateKey } from '../utils/derive-solana-private-key';
import { getLowestUnusedIndex } from '../utils/get-lowest-unused-index';
import { getNetworkFromToken } from '../utils/get-network-from-token';
import type { ILogger } from '../utils/logger';
import { logMaybeSolanaError } from '../utils/logMaybeSolanaError';
import type { TransferSolParams } from '../validation/structs';
import {
  GetAccounBalancesResponseStruct,
  TransferSolParamsStruct,
} from '../validation/structs';
import { validateRequest } from '../validation/validators';
import type { SolanaConnection } from './connection/SolanaConnection';
import { SolanaState } from './state';
import type { TransferSolHelper } from './TransferSolHelper/TransferSolHelper';

/**
 * We need to store the index of the KeyringAccount in the state because
 * we want to be able to restore any account with a previously used index.
 */
export type SolanaKeyringAccount = {
  index: number;
  privateKeyBytesAsNum: number[];
} & KeyringAccount;

export class SolanaKeyring implements Keyring {
  readonly #state: SolanaState;

  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  readonly #transferSolHelper: TransferSolHelper;

  constructor(
    connection: SolanaConnection,
    logger: ILogger,
    transferSolHelper: TransferSolHelper,
  ) {
    this.#state = new SolanaState();
    this.#connection = connection;
    this.#logger = logger;
    this.#transferSolHelper = transferSolHelper;
  }

  async listAccounts(): Promise<SolanaKeyringAccount[]> {
    try {
      const currentState = await this.#state.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};

      return Object.values(keyringAccounts).sort((a, b) => a.index - b.index);
    } catch (error: any) {
      this.#logger.error({ error }, 'Error listing accounts');
      throw new Error('Error listing accounts');
    }
  }

  async getAccount(id: string): Promise<SolanaKeyringAccount | undefined> {
    try {
      const currentState = await this.#state.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};

      return keyringAccounts?.[id];
    } catch (error: any) {
      this.#logger.error({ error }, 'Error getting account'); // TODO: This can only fail in one way. Failed to read the state.
      throw new Error('Error getting account');
    }
  }

  async getAccountOrThrow(id: string): Promise<SolanaKeyringAccount> {
    const account = await this.getAccount(id);
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }

  async createAccount(
    options?: Record<string, Json>,
  ): Promise<SolanaKeyringAccount> {
    // eslint-disable-next-line no-restricted-globals
    const id = crypto.randomUUID();
    const keyringAccounts = await this.listAccounts();
    const index = getLowestUnusedIndex(keyringAccounts);

    const privateKeyBytes = await deriveSolanaPrivateKey(index);
    const privateKeyBytesAsNum = Array.from(privateKeyBytes);

    const keyPair = await createKeyPairFromPrivateKeyBytes(privateKeyBytes);

    const accountAddress = await getAddressFromPublicKey(keyPair.publicKey);

    const keyringAccount: SolanaKeyringAccount = {
      id,
      index,
      privateKeyBytesAsNum,
      type: SolAccountType.DataAccount,
      address: accountAddress,
      options: options ?? {},
      methods: [SolMethod.SendAndConfirmTransaction],
    };

    this.#logger.log(
      'New keyring account object created, sending it to the extension...',
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

    this.#logger.log(
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

    return keyringAccount;
  }

  async deleteAccount(id: string): Promise<void> {
    try {
      await this.#state.update((state) => {
        delete state?.keyringAccounts?.[id];
        return state;
      });
      await this.#emitEvent(KeyringEvent.AccountDeleted, { id });
    } catch (error: any) {
      this.#logger.error({ error }, 'Error deleting account');
      throw new Error('Error deleting account');
    }
  }

  async getAccountBalances(
    accountId: string,
    assets: CaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    try {
      const account = await this.getAccountOrThrow(accountId);
      const balances = new Map<string, [string, string]>();

      const assetsByNetwork = assets.reduce<
        Record<SolanaCaip2Networks, string[]>
      >((groups, asset) => {
        const network = getNetworkFromToken(asset) as SolanaCaip2Networks;
        if (!groups[network]) {
          groups[network] = [];
        }
        groups[network].push(asset);
        return groups;
      }, {} as Record<SolanaCaip2Networks, string[]>);

      for (const network of Object.keys(assetsByNetwork)) {
        const currentNetwork = network as SolanaCaip2Networks;
        const networkAssets = assetsByNetwork[currentNetwork];

        for (const asset of networkAssets) {
          if (asset.endsWith(SolanaCaip19Tokens.SOL)) {
            const response = await this.#connection
              .getRpc(currentNetwork)
              .getBalance(address(account.address))
              .send();

            const balance = lamportsToSol(response.value).toFixed();
            balances.set(asset, [SOL_SYMBOL, balance]);
            this.#logger.log(
              { asset, balance, network: currentNetwork },
              'Native SOL balance',
            );
          } else {
            // Tokens: unsuported
            this.#logger.log(
              { asset, network: currentNetwork },
              'Unsupported asset',
            );
          }
        }
      }

      const response = Object.fromEntries(
        [...balances.entries()].map(([key, [unit, amount]]) => [
          key,
          { amount, unit },
        ]),
      );
      assert(response, GetAccounBalancesResponseStruct);

      return response;
    } catch (error: any) {
      logMaybeSolanaError(error);
      this.#logger.error({ error }, 'Error getting account balances');
      throw new Error('Error getting account balances');
    }
  }

  async #emitEvent(
    event: KeyringEvent,
    data: Record<string, Json>,
  ): Promise<void> {
    await emitSnapKeyringEvent(snap, event, data);
  }

  async filterAccountChains(id: string, chains: string[]): Promise<string[]> {
    throw new Error(`Implement me! ${id} ${chains.toString()}`);
  }

  async updateAccount(account: KeyringAccount): Promise<void> {
    throw new Error(`Implement me! ${JSON.stringify(account)}`);
  }

  async submitRequest(request: KeyringRequest): Promise<KeyringResponse> {
    return { pending: false, result: await this.#handleSubmitRequest(request) };
  }

  async #handleSubmitRequest(request: KeyringRequest): Promise<Json> {
    const { scope, account: accountId } = request;
    const { method, params } = request.request;

    const account = await this.getAccountOrThrow(accountId);

    switch (method) {
      case SolMethod.SendAndConfirmTransaction: {
        validateRequest(params, TransferSolParamsStruct as Struct<any>);
        const { to, amount } = params as TransferSolParams;
        const signature = await this.#transferSolHelper.transferSol(
          account,
          to,
          amount,
          scope as SolanaCaip2Networks,
        );
        return { signature };
      }

      default:
        throw new MethodNotFoundError() as Error;
    }
  }
}
