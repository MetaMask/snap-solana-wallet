/* eslint-disable no-void */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
import type { Balance } from '@metamask/keyring-api';
import {
  KeyringEvent,
  ListAccountAssetsResponseStruct,
  ResolveAccountAddressRequestStruct,
  SolAccountType,
  SolMethod,
  SolScope,
  type Keyring,
  type KeyringAccount,
  type KeyringRequest,
  type KeyringResponse,
  type ResolvedAccountAddress,
  type Transaction,
} from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { Json } from '@metamask/snaps-controllers';
import type { CaipAssetType, JsonRpcRequest } from '@metamask/snaps-sdk';
import { MethodNotFoundError } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';
import { type CaipChainId } from '@metamask/utils';
import type { Signature } from '@solana/web3.js';
import { address as asAddress, getAddressDecoder } from '@solana/web3.js';

import {
  DEFAULT_CONFIRMATION_CONTEXT,
  renderConfirmation,
} from '../../../features/confirmation/renderConfirmation';
import type { AssetsService } from '../../services/assets/AssetsService';
import type { EncryptedState } from '../../services/encrypted-state/EncryptedState';
import type { TransactionsService } from '../../services/transactions/TransactionsService';
import { SolanaWalletRequestStruct } from '../../services/wallet/structs';
import type { WalletService } from '../../services/wallet/WalletService';
import { deriveSolanaPrivateKey } from '../../utils/deriveSolanaPrivateKey';
import { getLowestUnusedIndex } from '../../utils/getLowestUnusedIndex';
import type { ILogger } from '../../utils/logger';
import {
  DeleteAccountStruct,
  GetAccounBalancesResponseStruct,
  GetAccountBalancesStruct,
  GetAccountStruct,
  ListAccountAssetsStruct,
  ListAccountTransactionsStruct,
  NetworkStruct,
} from '../../validation/structs';
import { validateRequest, validateResponse } from '../../validation/validators';
import { ScheduleBackgroundEventMethod } from '../onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import { SolanaKeyringRequestStruct } from './structs';

/**
 * We need to store the index of the KeyringAccount in the state because
 * we want to be able to restore any account with a previously used index.
 */
export type SolanaKeyringAccount = {
  index: number;
} & KeyringAccount;

export class SolanaKeyring implements Keyring {
  readonly #state: EncryptedState;

  readonly #logger: ILogger;

  readonly #transactionsService: TransactionsService;

  readonly #assetsService: AssetsService;

  readonly #walletService: WalletService;

  constructor({
    state,
    logger,
    transactionsService,
    assetsService,
    walletService,
  }: {
    state: EncryptedState;
    logger: ILogger;
    transactionsService: TransactionsService;
    assetsService: AssetsService;
    walletService: WalletService;
  }) {
    this.#state = state;
    this.#logger = logger;
    this.#transactionsService = transactionsService;
    this.#assetsService = assetsService;
    this.#walletService = walletService;
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

  async getAccount(
    accountId: string,
  ): Promise<SolanaKeyringAccount | undefined> {
    try {
      validateRequest({ accountId }, GetAccountStruct);

      const currentState = await this.#state.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};

      if (!keyringAccounts[accountId]) {
        throw new Error(`Account "${accountId}" not found`);
      }

      return keyringAccounts?.[accountId];
    } catch (error: any) {
      this.#logger.error({ error }, 'Error getting account');
      throw error;
    }
  }

  async getAccountOrThrow(accountId: string): Promise<SolanaKeyringAccount> {
    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error(`Account "${accountId}" not found`);
    }

    return account;
  }

  async createAccount(options?: {
    importedAccount?: boolean;
    index?: number;
    [key: string]: Json | undefined;
    accountNameSuggestion?: string;
  }): Promise<KeyringAccount> {
    // eslint-disable-next-line no-restricted-globals
    const id = crypto.randomUUID();

    try {
      // Find the account index
      let index: number;
      if (options?.importedAccount && typeof options.index === 'number') {
        // Use the provided index for imported accounts
        index = options.index;
      } else {
        // Get the lowest unused index for new accounts
        const keyringAccounts = await this.listAccounts();
        index = getLowestUnusedIndex(keyringAccounts);
      }

      const { publicKeyBytes } = await deriveSolanaPrivateKey(index);
      const accountAddress = getAddressDecoder().decode(
        publicKeyBytes.slice(1),
      );

      // Filter out our special properties from options
      const {
        importedAccount,
        index: _,
        accountNameSuggestion,
        ...remainingOptions
      } = options ?? {};

      const solanaKeyringAccount: SolanaKeyringAccount = {
        id,
        index,
        type: SolAccountType.DataAccount,
        address: accountAddress,
        scopes: [SolScope.Mainnet, SolScope.Testnet, SolScope.Devnet],
        options: {
          ...remainingOptions,
          imported: importedAccount ?? false,
        },
        methods: [
          SolMethod.SignAndSendTransaction,
          SolMethod.SignTransaction,
          SolMethod.SignMessage,
          SolMethod.SignIn,
        ],
      };

      await this.#state.update((state) => ({
        ...state,
        keyringAccounts: {
          ...(state?.keyringAccounts ?? {}),
          [solanaKeyringAccount.id]: solanaKeyringAccount,
        },
      }));

      const keyringAccount: KeyringAccount = {
        type: solanaKeyringAccount.type,
        id: solanaKeyringAccount.id,
        address: solanaKeyringAccount.address,
        options: solanaKeyringAccount.options,
        methods: solanaKeyringAccount.methods,
        scopes: solanaKeyringAccount.scopes,
      };

      await this.emitEvent(KeyringEvent.AccountCreated, {
        /**
         * We can't pass the `keyringAccount` object because it contains the index
         * and the snaps sdk does not allow extra properties.
         */
        account: keyringAccount,
        accountNameSuggestion:
          accountNameSuggestion ?? `Solana Account ${index + 1}`,
        displayAccountNameSuggestion: !accountNameSuggestion,
      });

      return keyringAccount;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error creating account');
      await this.#deleteAccountFromState(id);

      throw new Error('Error creating account');
    }
  }

  async #deleteAccountFromState(accountId: string): Promise<void> {
    await this.#state.update((state) => {
      if (state?.keyringAccounts?.[accountId]) {
        delete state?.keyringAccounts?.[accountId];
        delete state?.assets?.[accountId];
        delete state?.transactions?.[accountId];
      }

      return state;
    });
  }

  async deleteAccount(accountId: string): Promise<void> {
    try {
      validateRequest({ accountId }, DeleteAccountStruct);

      await this.#deleteAccountFromState(accountId);

      await this.emitEvent(KeyringEvent.AccountDeleted, { id: accountId });
    } catch (error: any) {
      this.#logger.error({ error }, 'Error deleting account');
      throw error;
    }
  }

  /**
   * Returns the list of assets for the given account in all Solana networks.
   * @param accountId - The id of the account.
   * @returns CAIP-19 assets ids.
   */
  async listAccountAssets(accountId: string): Promise<CaipAssetType[]> {
    try {
      validateRequest({ accountId }, ListAccountAssetsStruct);

      const account = await this.getAccountOrThrow(accountId);

      const result = await this.#assetsService.listAccountAssets(account);

      validateResponse(result, ListAccountAssetsResponseStruct);

      return result;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error listing account assets');
      throw error;
    }
  }

  /**
   * Returns the balances and metadata of the given account for the given assets.
   * @param accountId - The id of the account.
   * @param assets - The assets to get the balances for (CAIP-19 ids).
   * @returns The balances and metadata of the account for the given assets.
   */
  async getAccountBalances(
    accountId: string,
    assets: CaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    try {
      validateRequest({ accountId, assets }, GetAccountBalancesStruct);

      const account = await this.getAccountOrThrow(accountId);
      const result = await this.#assetsService.getAccountBalances(
        account,
        assets,
      );

      validateResponse(result, GetAccounBalancesResponseStruct);
      return result;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error getting account balances');
      throw error;
    }
  }

  async emitEvent(
    event: KeyringEvent,
    data: Record<string, Json>,
  ): Promise<void> {
    await emitSnapKeyringEvent(snap, event, data);
  }

  async filterAccountChains(
    accountId: string,
    chains: string[],
  ): Promise<string[]> {
    throw new Error(`Implement me! ${accountId} ${chains.toString()}`);
  }

  async updateAccount(account: KeyringAccount): Promise<void> {
    throw new Error(`Implement me! ${JSON.stringify(account)}`);
  }

  async submitRequest(request: KeyringRequest): Promise<KeyringResponse> {
    return { pending: false, result: await this.#handleSubmitRequest(request) };
  }

  async #handleSubmitRequest(request: KeyringRequest): Promise<Json> {
    assert(request, SolanaKeyringRequestStruct);

    const {
      request: { method, params },
      scope,
      account: accountId,
    } = request;
    const base64EncodedTransaction = (params as any).transaction ?? '';

    const account = await this.getAccountOrThrow(accountId);

    if (!account.scopes.includes(scope)) {
      throw new Error(`Scope "${scope}" is not allowed for this account`);
    }

    if (!account.methods.includes(method)) {
      throw new Error(`Method "${method}" is not allowed for this account`);
    }

    if ('scope' in params && scope !== params.scope) {
      throw new Error(
        `Scope "${scope}" does not match "${params.scope}" in request.params`,
      );
    }

    // Trigger the side effects that need to happen when the transaction is shown in confirmation UI
    void snap.request({
      method: 'snap_scheduleBackgroundEvent',
      params: {
        duration: 'PT1S',
        request: {
          method: ScheduleBackgroundEventMethod.OnTransactionAdded,
          params: {
            accountId,
            base64EncodedTransactionMessage: base64EncodedTransaction,
            scope,
          },
        },
      },
    });

    const isConfirmed = await renderConfirmation({
      ...DEFAULT_CONFIRMATION_CONTEXT,
      scope,
      method,
      transaction: base64EncodedTransaction,
      account,
    });

    if (!isConfirmed) {
      // Trigger the side effects that need to happen when the transaction is rejected
      void snap.request({
        method: 'snap_scheduleBackgroundEvent',
        params: {
          duration: 'PT1S',
          request: {
            method: ScheduleBackgroundEventMethod.OnTransactionRejected,
            params: {
              accountId,
              base64EncodedTransactionMessage: base64EncodedTransaction,
              scope,
            },
          },
        },
      });

      return null;
    }

    // Trigger the side effects that need to happen when the transaction is approved
    void snap.request({
      method: 'snap_scheduleBackgroundEvent',
      params: {
        duration: 'PT1S',
        request: {
          method: ScheduleBackgroundEventMethod.OnTransactionApproved,
          params: {
            accountId,
            base64EncodedTransactionMessage: base64EncodedTransaction,
            scope,
          },
        },
      },
    });

    switch (method) {
      case SolMethod.SignAndSendTransaction:
        return this.#walletService.signAndSendTransaction(account, request);
      default:
        throw new MethodNotFoundError(
          `Unsupported method: ${method}`,
        ) as unknown as Error;
    }
  }

  /**
   * Bootstrap the transactions for the given account.
   * @param accountId - The id of the account.
   * @param pagination - The pagination options.
   * @param pagination.limit - The limit of the transactions to fetch.
   * @param pagination.next - The next signature to fetch from.
   * @returns The transactions for the given account.
   */
  async listAccountTransactions(
    accountId: string,
    pagination: { limit: number; next?: Signature | null },
  ): Promise<{
    data: Transaction[];
    next: Signature | null;
  }> {
    try {
      validateRequest({ accountId, pagination }, ListAccountTransactionsStruct);

      const keyringAccount = await this.getAccount(accountId);

      if (!keyringAccount) {
        throw new Error('Account not found');
      }

      const currentState = await this.#state.get();
      const allTransactions = currentState?.transactions?.[accountId] ?? [];

      /**
       * If we don't have any transactions, we might need to bootstrap them as this may be the first call.
       * We'll fetch the transactions from the blockchain and store them in the state.
       */
      if (!allTransactions.length) {
        await this.#state.update((state) => ({
          ...state,
          isFetchingTransactions: true,
        }));

        const transactions = (
          await this.#transactionsService.fetchLatestAddressTransactions(
            asAddress(keyringAccount.address),
            pagination.limit,
          )
        ).map((tx) => ({
          ...tx,
          account: keyringAccount.id,
        }));

        await this.#state.update((state) => ({
          ...state,
          isFetchingTransactions: false,
          transactions: {
            ...(state?.transactions ?? {}),
            [keyringAccount.id]: transactions,
          },
        }));

        return {
          data: transactions,
          next: null,
        };
      }

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
    } catch (error: any) {
      this.#logger.error({ error }, 'Error listing account transactions');
      await this.#state.update((state) => ({
        ...state,
        isFetchingTransactions: false,
      }));
      throw error;
    }
  }

  /**
   * Resolves the address of an account from a signing request.
   *
   * This is required by the routing system of MetaMask to dispatch
   * incoming non-EVM dapp signing requests.
   *
   * @param scope - Request's scope (CAIP-2).
   * @param request - Signing request object.
   * @returns A Promise that resolves to the account address that must
   * be used to process this signing request, or null if none candidates
   * could be found.
   */
  async resolveAccountAddress(
    scope: CaipChainId,
    request: JsonRpcRequest,
  ): Promise<ResolvedAccountAddress | null> {
    try {
      assert(scope, NetworkStruct);
      assert(request, ResolveAccountAddressRequestStruct);
      const { method, params } = request.params.request;

      const requestWithoutCommonHeader = { method, params };
      assert(requestWithoutCommonHeader, SolanaWalletRequestStruct);

      const allAccounts = await this.listAccounts();

      const caip10Address = await this.#walletService.resolveAccountAddress(
        allAccounts,
        scope,
        requestWithoutCommonHeader,
      );

      return { address: caip10Address };
    } catch (error: any) {
      this.#logger.error({ error }, 'Error resolving account address');
      return null;
    }
  }
}
