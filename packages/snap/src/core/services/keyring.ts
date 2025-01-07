/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
import type { Transaction } from '@metamask/keyring-api';
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
import { type Json } from '@metamask/snaps-sdk';
import type { Address, Signature } from '@solana/web3.js';
import {
  address as asAddress,
  createKeyPairFromPrivateKeyBytes,
  getAddressFromPublicKey,
} from '@solana/web3.js';
import { assert } from 'superstruct';

import type { SolanaCaip2Networks } from '../constants/solana';
import {
  LAMPORTS_PER_SOL,
  SOL_SYMBOL,
  SolanaCaip19Tokens,
} from '../constants/solana';
import { deriveSolanaPrivateKey } from '../utils/derive-solana-private-key';
import { getLowestUnusedIndex } from '../utils/get-lowest-unused-index';
import { getNetworkFromToken } from '../utils/get-network-from-token';
import type { ILogger } from '../utils/logger';
import { logMaybeSolanaError } from '../utils/logMaybeSolanaError';
import type { SendAndConfirmTransactionParams } from '../validation/structs';
import { GetAccounBalancesResponseStruct } from '../validation/structs';
import type { SolanaConnection } from './connection/SolanaConnection';
import type { EncryptedSolanaState } from './encrypted-state';
import type { SolanaState } from './state';
import type { TransactionsService } from './transactions';
import type { TransferSolHelper } from './TransferSolHelper/TransferSolHelper';
import type { TransferSPLTokenHelper } from './TransferSPLTokenHelper/TransferSPLTokenHelper';
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

  readonly #encryptedState: EncryptedSolanaState;

  readonly #connection: SolanaConnection;

  readonly #transactionsService: TransactionsService;

  readonly #transferSolHelper: TransferSolHelper;

  readonly #transferSPLTokenHelper: TransferSPLTokenHelper;

  readonly #logger: ILogger;

  constructor({
    state,
    encryptedState,
    connection,
    transactionsService,
    transferSolHelper,
    transferSPLTokenHelper,
    logger,
  }: {
    state: SolanaState;
    encryptedState: EncryptedSolanaState;
    connection: SolanaConnection;
    transactionsService: TransactionsService;
    transferSolHelper: TransferSolHelper;
    transferSPLTokenHelper: TransferSPLTokenHelper;
    logger: ILogger;
  }) {
    this.#state = state;
    this.#encryptedState = encryptedState;
    this.#connection = connection;
    this.#transactionsService = transactionsService;
    this.#transferSolHelper = transferSolHelper;
    this.#transferSPLTokenHelper = transferSPLTokenHelper;
    this.#logger = logger;
  }

  async listAccounts(): Promise<SolanaKeyringAccount[]> {
    try {
      const currentState = await this.#encryptedState.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};

      return Object.values(keyringAccounts).sort((a, b) => a.index - b.index);
    } catch (error: any) {
      this.#logger.error({ error }, 'Error listing accounts');
      throw new Error('Error listing accounts');
    }
  }

  async getAccount(id: string): Promise<SolanaKeyringAccount | undefined> {
    try {
      const currentState = await this.#encryptedState.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};

      return keyringAccounts?.[id];
    } catch (error: any) {
      this.#logger.error({ error }, 'Error getting account');
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
    try {
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

      await this.#encryptedState.update((state) => {
        return {
          ...state,
          keyringAccounts: {
            ...(state?.keyringAccounts ?? {}),
            [keyringAccount.id]: keyringAccount,
          },
        };
      });

      try {
        const transactions = (
          await this.#transactionsService.fetchInitialAddressTransactions(
            keyringAccount.address as Address,
          )
        ).map((tx) => ({
          ...tx,
          account: keyringAccount.id,
        }));

        await this.#state.update((state) => {
          return {
            ...state,
            transactions: {
              ...(state?.transactions ?? {}),
              [keyringAccount.id]: [...transactions],
            },
          };
        });
      } catch (error: any) {
        this.#logger.error({ error }, 'Error fetching initial transactions');
      }

      return keyringAccount;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error creating account');
      throw new Error('Error creating account');
    }
  }

  async deleteAccount(id: string): Promise<void> {
    try {
      await Promise.all([
        this.#encryptedState.update((state) => {
          delete state?.keyringAccounts?.[id];
          return state;
        }),
        this.#state.update((state) => {
          delete state?.transactions?.[id];
          return state;
        }),
      ]);
      await this.#emitEvent(KeyringEvent.AccountDeleted, { id });
    } catch (error: any) {
      this.#logger.error({ error }, 'Error deleting account');
      throw new Error('Error deleting account');
    }
  }

  async getAccountBalances(
    id: string,
    assets: CaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    try {
      const account = await this.getAccount(id);
      const balances = new Map<string, [string, string]>();

      if (!account) {
        throw new Error('Account not found');
      }

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
              .getBalance(asAddress(account.address))
              .send();

            const balance = String(Number(response.value) / LAMPORTS_PER_SOL);
            balances.set(asset, [SOL_SYMBOL, balance]);
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
    const { method } = request.request;

    const methodToHandler: Record<
      SolMethod,
      (request: KeyringRequest) => Promise<Json>
    > = {
      [SolMethod.SendAndConfirmTransaction]:
        this.handleSendAndConfirmTransaction,
      // Register other handlers here
    };

    return methodToHandler[method as SolMethod](request);
  }

  async handleSendAndConfirmTransaction(
    request: KeyringRequest,
  ): Promise<{ signature: string }> {
    const { scope, account: accountId } = request;
    const { params } = request.request;
    const { to, assetCaip19Id, amount } =
      params as SendAndConfirmTransactionParams;

    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    if (assetCaip19Id.endsWith(SolanaCaip19Tokens.SOL)) {
      const signature = await this.#transferSolHelper.transferSol(
        account,
        to,
        amount,
        scope as SolanaCaip2Networks,
      );
      return { signature };
    }

    const signature = await this.#transferSPLTokenHelper.transferSPLToken(
      account,
      to,
      assetCaip19Id,
      amount,
      scope as SolanaCaip2Networks,
    );
    return { signature };
  }

  async listAccountTransactions(
    accountId: string,
    pagination: { limit: number; next?: Signature | null },
  ): Promise<{
    data: Transaction[];
    next: Signature | null;
  }> {
    const keyringAccount = await this.getAccount(accountId);

    if (!keyringAccount) {
      throw new Error('Account not found');
    }

    const currentState = await this.#state.get();

    const allTransactions = currentState?.transactions?.[accountId] ?? [];

    // Find the starting index based on the 'next' signature
    const startIndex = pagination.next
      ? allTransactions.findIndex((tx) => tx.id === pagination.next)
      : 0;

    // Get transactions from startIndex to startIndex + limit
    const accountTransactions = allTransactions.slice(
      startIndex,
      startIndex + pagination.limit,
    );

    // Determine the next signature for pagination
    const hasMore = startIndex + pagination.limit < allTransactions.length;
    const nextSignature = hasMore
      ? (allTransactions[startIndex + pagination.limit]?.id as Signature) ??
        null
      : null;

    return {
      data: accountTransactions,
      next: nextSignature,
    };
  }
}
