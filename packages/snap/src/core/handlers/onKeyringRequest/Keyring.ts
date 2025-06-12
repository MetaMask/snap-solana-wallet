/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
import type {
  DiscoveredAccount,
  EntropySourceId,
  KeyringEventPayload,
  MetaMaskOptions,
} from '@metamask/keyring-api';
import {
  KeyringEvent,
  ListAccountAssetsResponseStruct,
  SolAccountType,
  SolMethod,
  SolScope,
  type Balance,
  type Keyring,
  type KeyringAccount,
  type KeyringRequest,
  type KeyringResponse,
  type ResolvedAccountAddress,
  type Transaction,
} from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { CaipAssetType, Json, JsonRpcRequest } from '@metamask/snaps-sdk';
import {
  MethodNotFoundError,
  SnapError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import { assert, integer } from '@metamask/superstruct';
import { type CaipChainId } from '@metamask/utils';
import type { Signature } from '@solana/kit';
import { address as asAddress, getAddressDecoder } from '@solana/kit';
import { sortBy } from 'lodash';

import {
  asStrictKeyringAccount,
  type SolanaKeyringAccount,
} from '../../../entities';
import { type Network } from '../../constants/solana';
import type { AssetsService } from '../../services/assets/AssetsService';
import type { ConfirmationHandler } from '../../services/confirmation/ConfirmationHandler';
import type { IStateManager } from '../../services/state/IStateManager';
import type { UnencryptedStateValue } from '../../services/state/State';
import type { TransactionsService } from '../../services/transactions/TransactionsService';
import { SolanaWalletRequestStruct } from '../../services/wallet/structs';
import type { WalletService } from '../../services/wallet/WalletService';
import { deriveSolanaKeypair } from '../../utils/deriveSolanaKeypair';
import { getLowestUnusedIndex } from '../../utils/getLowestUnusedIndex';
import { listEntropySources } from '../../utils/interface';
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
import {
  DiscoverAccountsRequestStruct,
  SolanaKeyringRequestStruct,
} from './structs';

export class SolanaKeyring implements Keyring {
  readonly #state: IStateManager<UnencryptedStateValue>;

  readonly #logger: ILogger;

  readonly #transactionsService: TransactionsService;

  readonly #assetsService: AssetsService;

  readonly #walletService: WalletService;

  readonly #confirmationHandler: ConfirmationHandler;

  constructor({
    state,
    logger,
    transactionsService,
    assetsService,
    walletService,
    confirmationHandler,
  }: {
    state: IStateManager<UnencryptedStateValue>;
    logger: ILogger;
    transactionsService: TransactionsService;
    assetsService: AssetsService;
    walletService: WalletService;
    confirmationHandler: ConfirmationHandler;
  }) {
    this.#state = state;
    this.#logger = logger;
    this.#transactionsService = transactionsService;
    this.#assetsService = assetsService;
    this.#walletService = walletService;
    this.#confirmationHandler = confirmationHandler;
  }

  async listAccounts(): Promise<SolanaKeyringAccount[]> {
    try {
      const keyringAccounts =
        (await this.#state.getKey<UnencryptedStateValue['keyringAccounts']>(
          'keyringAccounts',
        )) ?? {};

      return sortBy(Object.values(keyringAccounts), ['entropySource', 'index']);
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

      const account = await this.#state.getKey<SolanaKeyringAccount>(
        `keyringAccounts.${accountId}`,
      );

      return account;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error getting account');
      throw new SnapError(error);
    }
  }

  async getAccountOrThrow(accountId: string): Promise<SolanaKeyringAccount> {
    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error(`Account "${accountId}" not found`);
    }

    return account;
  }

  #getLowestUnusedKeyringAccountIndex(
    accounts: SolanaKeyringAccount[],
    entropySource: EntropySourceId,
  ): number {
    const accountsFilteredByEntropySourceId = accounts.filter(
      (account) => account.entropySource === entropySource,
    );

    return getLowestUnusedIndex(accountsFilteredByEntropySourceId);
  }

  #getDefaultDerivationPath(index: number): `m/${string}` {
    return `m/44'/501'/${index}'/0'`;
  }

  #getIndexFromDerivationPath(derivationPath: `m/${string}`): number {
    const levels = derivationPath.split('/');
    const indexLevel = levels[3];

    if (!indexLevel) {
      throw new Error('Invalid derivation path');
    }

    const index = parseInt(indexLevel.replace("'", ''), 10);
    assert(index, integer());

    return index;
  }

  async #getDefaultEntropySource(): Promise<EntropySourceId> {
    const entropySources = await listEntropySources();
    const defaultEntropySource = entropySources.find(({ primary }) => primary);

    if (!defaultEntropySource) {
      throw new Error(
        'No default entropy source found - this can never happen',
      );
    }

    return defaultEntropySource.id;
  }

  async createAccount(
    options?: {
      entropySource?: EntropySourceId;
      derivationPath?: `m/${string}`;
      accountNameSuggestion?: string;
      [key: string]: Json | undefined;
    } & MetaMaskOptions,
  ): Promise<KeyringAccount> {
    const id = globalThis.crypto.randomUUID();

    try {
      const accounts = await this.listAccounts();

      const entropySource =
        options?.entropySource ?? (await this.#getDefaultEntropySource());

      const index = options?.derivationPath
        ? this.#getIndexFromDerivationPath(options.derivationPath)
        : this.#getLowestUnusedKeyringAccountIndex(accounts, entropySource);

      const derivationPath = options?.derivationPath
        ? options.derivationPath
        : this.#getDefaultDerivationPath(index);

      /**
       * Now that we have the `entropySource` and `derivationPath` ready,
       * we need to make sure that they do not correspond to an existing account already.
       */
      const sameAccount = accounts.find(
        (account) =>
          account.derivationPath === derivationPath &&
          account.entropySource === entropySource,
      );

      if (sameAccount) {
        this.#logger.warn(
          '[🔑 Keyring] An account already exists with the same derivation path and entropy source. Skipping account creation.',
        );
        return asStrictKeyringAccount(sameAccount);
      }

      const { publicKeyBytes } = await deriveSolanaKeypair({
        entropySource,
        derivationPath,
      });

      const accountAddress = getAddressDecoder().decode(
        publicKeyBytes.slice(1),
      );

      // Filter out our special properties from options
      const {
        importedAccount,
        accountNameSuggestion,
        metamask: metamaskOptions,
        ...remainingOptions
      } = options ?? {};

      const solanaKeyringAccount: SolanaKeyringAccount = {
        id,
        entropySource,
        derivationPath,
        index,
        type: SolAccountType.DataAccount,
        address: accountAddress,
        scopes: [SolScope.Mainnet, SolScope.Testnet, SolScope.Devnet],
        options: {
          ...remainingOptions,
          /**
           * Make sure to save the `entropySource`, `derivationPath` and `index`
           * in the keyring account options..
           */
          entropySource,
          derivationPath,
          index,
        },
        methods: [
          SolMethod.SignAndSendTransaction,
          SolMethod.SignTransaction,
          SolMethod.SignMessage,
          SolMethod.SignIn,
        ],
      };

      await this.#state.setKey(
        `keyringAccounts.${solanaKeyringAccount.id}`,
        solanaKeyringAccount,
      );

      const keyringAccount: KeyringAccount =
        asStrictKeyringAccount(solanaKeyringAccount);

      await this.emitEvent(KeyringEvent.AccountCreated, {
        /**
         * We can't pass the `keyringAccount` object because it contains the index
         * and the snaps sdk does not allow extra properties.
         */
        account: keyringAccount,
        accountNameSuggestion:
          accountNameSuggestion ?? `Solana Account ${index + 1}`,
        displayAccountNameSuggestion: !accountNameSuggestion,
        /**
         * Skip account creation confirmation dialogs to make it look like a native
         * account creation flow.
         */
        displayConfirmation: false,
        /**
         * Internal options to MetaMask that includes a correlation ID. We need
         * to also emit this ID to the Snap keyring.
         */
        ...(metamaskOptions
          ? {
              metamask: metamaskOptions,
            }
          : {}),
      });

      return keyringAccount;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error creating account');
      await this.#deleteAccountFromState(id);

      throw new Error(`Error creating account: ${error.message}`);
    }
  }

  async #deleteAccountFromState(accountId: string): Promise<void> {
    await Promise.all([
      this.#state.deleteKey(`keyringAccounts.${accountId}`),
      this.#state.deleteKey(`transactions.${accountId}`),
      this.#state.deleteKey(`assets.${accountId}`),
    ]);
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
    data: KeyringEventPayload<KeyringEvent>,
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
      origin,
    } = request;

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

    const isConfirmed = await this.#confirmationHandler.handleKeyringRequest(
      request,
      account,
    );

    if (!isConfirmed) {
      throw new UserRejectedRequestError() as unknown as Error;
    }

    switch (method) {
      case SolMethod.SignAndSendTransaction: {
        const { transaction: base64EncodedTransaction, options } = params;
        return this.#walletService.signAndSendTransaction(
          account,
          base64EncodedTransaction,
          scope,
          origin,
          options,
        );
      }
      case SolMethod.SignTransaction:
        return this.#walletService.signTransaction(account, request);
      case SolMethod.SignMessage:
        return this.#walletService.signMessage(account, request);
      case SolMethod.SignIn:
        return this.#walletService.signIn(account, request);
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

      const allTransactions =
        (await this.#state.getKey<Transaction[]>(
          `transactions.${accountId}`,
        )) ?? [];

      /**
       * If we don't have any transactions, we might need to bootstrap them as this may be the first call.
       * We'll fetch the transactions from the blockchain and store them in the state.
       */
      if (!allTransactions.length) {
        const transactions = (
          await this.#transactionsService.fetchLatestAddressTransactions(
            asAddress(keyringAccount.address),
            pagination.limit,
          )
        ).map((tx) => ({
          ...tx,
          account: keyringAccount.id,
        }));

        await this.#state.setKey(
          `transactions.${keyringAccount.id}`,
          transactions,
        );

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
        ? ((allTransactions[startIndex + pagination.limit]?.id as Signature) ??
          null)
        : null;

      return {
        data: accountTransactions,
        next: nextSignature,
      };
    } catch (error: any) {
      this.#logger.error({ error }, 'Error listing account transactions');
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
      const { method, params } = request;

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

  /**
   * Checks if a Solana account has activity on the given scopes. The Solana account
   * is derived using the BIP-44 derivation path `m/44'/501'/${groupIndex}'/0'`, applied
   * to the SRP referenced by the entropy source.
   *
   * @param scopes - The scopes to discover the accounts for.
   * @param entropySource - The entropy source aka Recovery Phrase.
   * @param groupIndex - The group index to use for the account discovery.
   * @returns The discovered accounts.
   */
  async discoverAccounts(
    scopes: CaipChainId[],
    entropySource: EntropySourceId,
    groupIndex: number,
  ): Promise<DiscoveredAccount[]> {
    try {
      assert(
        { scopes, entropySource, groupIndex },
        DiscoverAccountsRequestStruct,
      );

      const derivationPath = this.#getDefaultDerivationPath(groupIndex);

      const keypair = await deriveSolanaKeypair({
        entropySource,
        derivationPath,
      });
      const address = getAddressDecoder().decode(
        keypair.publicKeyBytes.slice(1),
      );

      const activityChecksPromises = [];

      for (const scope of scopes) {
        activityChecksPromises.push(
          this.#transactionsService.fetchLatestSignatures(
            scope as Network,
            address,
            1,
          ),
        );
      }

      const scopeSignatures = await Promise.all(activityChecksPromises);
      const hasActivity = scopeSignatures.some(
        (signatures) => signatures.length > 0,
      );

      if (!hasActivity) {
        return [];
      }

      return [
        {
          type: 'bip44',
          scopes,
          derivationPath,
        },
      ];
    } catch (error: any) {
      this.#logger.error({ error }, 'Error discovering accounts');
      throw error;
    }
  }
}
