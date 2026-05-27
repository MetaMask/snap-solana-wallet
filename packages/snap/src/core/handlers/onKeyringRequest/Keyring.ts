/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
import { SLIP10Node } from '@metamask/key-tree';
import type {
  CreateAccountOptions,
  DiscoveredAccount,
  EntropySourceId,
  KeyringEventPayload,
  MetaMaskOptions,
  Pagination,
} from '@metamask/keyring-api';
import {
  AccountCreationType,
  assertCreateAccountOptionIsSupported,
  KeyringEvent,
  ListAccountAssetsResponseStruct,
  SolAccountType,
  SolMethod,
  SolScope,
  type Balance,
  type KeyringAccount,
  type KeyringRequest,
  type KeyringResponse,
  type ResolvedAccountAddress,
  type Transaction,
} from '@metamask/keyring-api';
import type { ExportAccountOptions, ExportedAccount, Keyring as RawKeyring } from '@metamask/keyring-api/v2'
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { CaipAssetType, Json, JsonRpcRequest } from '@metamask/snaps-sdk';
import {
  InvalidParamsError,
  MethodNotFoundError,
  SnapError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import { array, assert, integer, union } from '@metamask/superstruct';
import { assertStruct, bytesToHex, HexStruct, type CaipChainId } from '@metamask/utils';
import type { Signature } from '@solana/kit';
import { address as asAddress, getAddressDecoder } from '@solana/kit';
import bs58 from 'bs58';
import { sortBy } from 'lodash';

import {
  asStrictKeyringAccount,
  type SolanaKeyringAccount,
} from '../../../entities';
import type { Network } from '../../constants/solana';
import { SolanaCaip19Tokens } from '../../constants/solana';
import type {
  AssetsService,
  KeyringAccountMonitor,
  TransactionsService,
} from '../../services';
import type { ConfirmationHandler } from '../../services/confirmation/ConfirmationHandler';
import type { IStateManager } from '../../services/state/IStateManager';
import type { UnencryptedStateValue } from '../../services/state/State';
import { SolanaWalletRequestStruct } from '../../services/wallet/structs';
import type { WalletService } from '../../services/wallet/WalletService';
import {
  deriveSolanaKeypair,
  deriveSolanaKeypairFromCoinTypeNode,
} from '../../utils/deriveSolanaKeypair';
import { getBip32Entropy } from '../../utils/getBip32Entropy';
import { getLowestUnusedIndex } from '../../utils/getLowestUnusedIndex';
import {
  endTrace,
  listEntropySources,
  startTrace,
} from '../../utils/interface';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import {
  Base58Struct,
  DeleteAccountStruct,
  ExportAccountRequestStruct,
  GetAccounBalancesResponseStruct,
  GetAccountBalancesStruct,
  GetAccountStruct,
  ListAccountAssetsStruct,
  ListAccountTransactionsStruct,
  NetworkStruct,
  UuidStruct,
} from '../../validation/structs';
import { validateRequest, validateResponse } from '../../validation/validators';
import {
  DiscoverAccountsRequestStruct,
  SolanaKeyringRequestStruct,
} from './structs';

/**
 * A Solana address decoder that we can reuse across the class to avoid instantiating multiple decoders.
 */
const decoder = getAddressDecoder();

/**
 * A type that represents the Keyring API but without properties that are irrelevant for the Solana snap.
 * 
 * 1. type: This is relevant to the snap keyring initialized in the clients.
 * 2. capabilities: This is defined in the snap manifest.
 * 3. serialize: This is not relevant as keyring state is stored in the clients.
 * 4. deserialize: This is not relevant as keyring state is stored in the clients.
 */
type Keyring = Omit<RawKeyring, 'type' | 'capabilities' | 'serialize' | 'deserialize' >;

export class SolanaKeyring implements Keyring {
  readonly #state: IStateManager<UnencryptedStateValue>;

  readonly #logger: ILogger;

  readonly #transactionsService: TransactionsService;

  readonly #assetsService: AssetsService;

  readonly #walletService: WalletService;

  readonly #confirmationHandler: ConfirmationHandler;

  readonly #keyringAccountMonitor: KeyringAccountMonitor;

  readonly #traceName: string = 'Create Solana Account';

  readonly #traceNameBatch: string = 'Create Solana Account Batch';

  constructor({
    state,
    logger,
    transactionsService,
    assetsService,
    walletService,
    confirmationHandler,
    keyringAccountMonitor,
  }: {
    state: IStateManager<UnencryptedStateValue>;
    logger: ILogger;
    transactionsService: TransactionsService;
    assetsService: AssetsService;
    walletService: WalletService;
    confirmationHandler: ConfirmationHandler;
    keyringAccountMonitor: KeyringAccountMonitor;
  }) {
    this.#state = state;
    this.#logger = createPrefixedLogger(logger, '[🔑 Keyring]');
    this.#transactionsService = transactionsService;
    this.#assetsService = assetsService;
    this.#walletService = walletService;
    this.#confirmationHandler = confirmationHandler;
    this.#keyringAccountMonitor = keyringAccountMonitor;
  }

  async listAccounts(): Promise<KeyringAccount[]> {
    try {
      return (await this.#listAccounts()).map(asStrictKeyringAccount);
    } catch (error: any) {
      this.#logger.error({ error }, 'Error listing accounts');
      throw new SnapError(error);
    }
  }

  async #listAccounts(): Promise<SolanaKeyringAccount[]> {
    try {
      const keyringAccounts =
        (await this.#state.getKey<UnencryptedStateValue['keyringAccounts']>(
          'keyringAccounts',
        )) ?? {};

      return sortBy(Object.values(keyringAccounts), ['entropySource', 'index']);
    } catch (error: any) {
      // Note: we intentionally do not log here. The public callers
      // (`listAccounts`, `createAccount`, etc.) wrap calls to this helper in
      // their own try/catch with a function-level log call, so logging here
      // would produce duplicate `'Error listing accounts'` entries on every
      // failure. We still rewrite to a stable error message so existing
      // consumers (and the `Error creating account: ...` prefix in
      // `createAccount`) keep their current observable behavior. The
      // original error is attached as `cause` to preserve the underlying
      // stack/details for debugging.
      throw new Error('Error listing accounts', { cause: error });
    }
  }

  async getAccount(
    accountId: string,
  ): Promise<KeyringAccount> {
    try {
      validateRequest({ accountId }, GetAccountStruct);

      const account = await this.getAccountOrThrow(accountId);

      return asStrictKeyringAccount(account);
    } catch (error: any) {
      this.#logger.error({ error }, 'Error getting account');
      throw new SnapError(error);
    }
  }


  /**
   * Gets all accounts from the state.
   *
   * Delegates to {@link listAccounts} so that any future changes to the
   * listing behavior (filtering, sorting, error handling) stay consistent
   * across both keyring entry points.
   *
   * @returns The accounts.
   */
  async getAccounts(): Promise<KeyringAccount[]> {
    return this.listAccounts();
  }

  async getAccountOrThrow(accountId: string): Promise<SolanaKeyringAccount> {
    const account = await this.#getAccount(accountId);
    if (!account) {
      throw new Error(`Account "${accountId}" not found`);
    }

    return account;
  }

  async #getAccount(
    accountId: string,
  ): Promise<SolanaKeyringAccount | undefined> {
    return this.#state.getKey<SolanaKeyringAccount>(
      `keyringAccounts.${accountId}`,
    );
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

  #buildKeyringAccount({
    id,
    entropySource,
    derivationPath,
    index,
    publicKeyBytes,
  }: {
    id: string;
    entropySource: EntropySourceId;
    derivationPath: `m/${string}`;
    index: number;
    publicKeyBytes: Uint8Array;
  }): SolanaKeyringAccount {
    const address = decoder.decode(
      publicKeyBytes.slice(1),
    );

    return {
      id,
      entropySource,
      derivationPath,
      index,
      type: SolAccountType.DataAccount,
      address,
      scopes: [SolScope.Mainnet, SolScope.Testnet, SolScope.Devnet],
      options: {
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
      await startTrace(this.#traceName);

      const accounts = await this.#listAccounts();

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
          'An account already exists with the same derivation path and entropy source. Skipping account creation.',
        );
        return asStrictKeyringAccount(sameAccount);
      }

      // Filter out our special properties from options
      const {
        accountNameSuggestion,
        metamask: metamaskOptions,
      } = options ?? {};

      const { publicKeyBytes } = await deriveSolanaKeypair({
        entropySource,
        derivationPath,
      });

      const solanaKeyringAccount =
        this.#buildKeyringAccount({
          id,
          entropySource,
          derivationPath,
          index,
          publicKeyBytes,
        });

      // Convert to strict KeyringAccount
      const keyringAccount = asStrictKeyringAccount(solanaKeyringAccount);

      // Save the account in the snap state
      await this.#state.setKey(
        `keyringAccounts.${solanaKeyringAccount.id}`,
        solanaKeyringAccount,
      );

      // Inform the client about the new account
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
      }).catch(async (error: any) => {
        // Rollback the saving of the account in the snap state to ensure data consistency between the snap and the client
        this.#logger.warn(
          'Could not inform the client about the account creation. Rolling back the account creation operation.',
          { error },
        );
        await this.#deleteAccountFromState(id);
        throw error;
      });

      await endTrace(this.#traceName);

      return keyringAccount;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error creating account');
      throw new Error(`Error creating account: ${error.message}`);
    }
  }

  async createAccounts(options: CreateAccountOptions): Promise<KeyringAccount[]> {
    try {
      assertCreateAccountOptionIsSupported(options, [
        `${AccountCreationType.Bip44DeriveIndex}`,
        `${AccountCreationType.Bip44DeriveIndexRange}`,
      ]);

      await startTrace(this.#traceNameBatch);

      // Get entropy source
      const entropySource =
        options.entropySource ?? (await this.#getDefaultEntropySource());

      // Map existing accounts by group index
      const allAccounts = new Map<number, SolanaKeyringAccount>();
      for (const account of await this.#listAccounts()) {
        if (account.entropySource === entropySource) {
          allAccounts.set(account.index, account);
        }
      }

      // Create a range of group indexes to create accounts for
      let range;
      if (options.type === AccountCreationType.Bip44DeriveIndex) {
        // Ranges are inclusive here, so to create an account for a specific index, the from and to values
        // are the same.
        range = { from: options.groupIndex, to: options.groupIndex };
      } else {
        range = options.range;
      }

      // Get coin-type node once (optimization: 1 snap API call for N accounts)
      const coinTypeNodeJson = await getBip32Entropy({
        entropySource,
        path: ['m', "44'", "501'"],
        curve: 'ed25519',
      });
      const coinTypeNode = await SLIP10Node.fromJSON(coinTypeNodeJson);

      // Create new accounts in memory, then flush all to state in one call
      let createdCount = 0;
      const newAccounts: Record<string, SolanaKeyringAccount> = {};
      for (let groupIndex = range.from; groupIndex <= range.to; groupIndex++) {
        if (!allAccounts.has(groupIndex)) {
          const id = globalThis.crypto.randomUUID();
          const derivationPath = this.#getDefaultDerivationPath(groupIndex);

          // Derive keypair locally using key-tree (no additional snap API call)
          const { publicKeyBytes } =
            await deriveSolanaKeypairFromCoinTypeNode({
              coinTypeNode,
              accountIndex: groupIndex,
            });

          const solanaKeyringAccount = this.#buildKeyringAccount({
            id,
            entropySource,
            derivationPath,
            index: groupIndex,
            publicKeyBytes,
          });

          // Keep track of the new account in our local map to be able to return the full list
          // of accounts at the end, sorted by group index.
          allAccounts.set(groupIndex, solanaKeyringAccount);

          // Save the account in the snap state (defer actual saving until the end of the
          // loop to minimize state writes).
          newAccounts[id] = solanaKeyringAccount;

          createdCount += 1;
        }
      }

      // Single state write for all new accounts
      await this.#state.setKeyWith<Record<string, SolanaKeyringAccount>>('keyringAccounts', (accounts) => ({
        ...accounts,
        ...newAccounts,
      }));

      await endTrace(this.#traceNameBatch);

      // Assemble final result: all accounts sorted by group index
      const result: KeyringAccount[] = [];
      for (let groupIndex = range.from; groupIndex <= range.to; groupIndex++) {
        const account = allAccounts.get(groupIndex);
        if (account) {
          result.push(asStrictKeyringAccount(account));
        }
      }

      this.#logger.info(
        `Created ${createdCount} new accounts, returned ${result.length} total accounts`,
      );

      return result;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error creating accounts batch');
      throw new Error(`Error creating accounts: ${error.message}`);
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

      await this.emitEvent(KeyringEvent.AccountDeleted, { id: accountId });

      // If we successfully deleted the account on the extension, we can proceed with cleaning up
      await this.#deleteAccountFromState(accountId);
    } catch (error: any) {
      this.#logger.error({ error }, 'Error deleting account');
      throw new SnapError(error);
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

      const assetEntities = await this.#assetsService.findByAccount(account);

      const result = assetEntities
        // Remove token assets with zero balance
        .filter(
          (asset) =>
            asset.assetType.endsWith(SolanaCaip19Tokens.SOL) ||
            Number(asset.rawAmount) > 0,
        )
        .map((asset) => asset.assetType);

      validateResponse(result, ListAccountAssetsResponseStruct);
      return result;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error listing account assets');
      throw new SnapError(error);
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

      const assetsToUse = (await this.#assetsService.findByAccount(account))
        .filter((asset) => assets.includes(asset.assetType))
        // Remove token assets with zero balance
        .filter(
          (asset) =>
            asset.assetType.endsWith(SolanaCaip19Tokens.SOL) ||
            Number(asset.rawAmount) > 0,
        );

      const result = assetsToUse.reduce<Record<CaipAssetType, Balance>>(
        (acc, asset) => {
          acc[asset.assetType] = {
            unit: asset.symbol,
            amount: asset.uiAmount,
          };
          return acc;
        },
        {},
      );

      validateResponse(result, GetAccounBalancesResponseStruct);
      return result;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error getting account balances');
      throw new SnapError(error);
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

    assert(scope, NetworkStruct);

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
      case SolMethod.SignTransaction: {
        this.#validateAccountAddress(account, request);
        const { transaction, options } = params;
        return this.#walletService.signTransaction(
          account,
          transaction,
          scope,
          origin,
          options,
        );
      }
      case SolMethod.SignMessage: {
        this.#validateAccountAddress(account, request);
        const { message } = params;
        return this.#walletService.signMessage(account, message);
      }
      case SolMethod.SignIn:
        return this.#walletService.signIn(account, params);
      default:
        throw new MethodNotFoundError(
          `Unsupported method: ${method}`,
        ) as unknown as Error;
    }
  }

  /**
   * Validates that the account address in the request parameters matches the signing account.
   * This prevents unauthorized account usage and authorization bypass.
   *
   * @param account - The account used for signing.
   * @param request - The request containing the account address to validate.
   * @throws If the account address is invalid or doesn't match the signing account.
   */
  #validateAccountAddress(
    account: SolanaKeyringAccount,
    request: KeyringRequest,
  ): void {
    const { address } = account;

    const { account: requestAccount } = request.request.params as {
      account: { address: string };
    };

    try {
      asAddress(requestAccount.address);
    } catch {
      throw new Error('Invalid Solana address format');
    }

    // Check that the account address in the request parameters matches the account used for signing
    // If it doesn't match, throw the same error MM throws when the account is not authorized
    if (requestAccount.address !== address) {
      throw new Error(
        'The requested account and/or method has not been authorized by the user.',
      );
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
    pagination: Pagination,
  ): Promise<{
    data: Transaction[];
    next: Signature | null;
  }> {
    try {
      validateRequest({ accountId, pagination }, ListAccountTransactionsStruct);
      const { limit, next } = pagination;

      const keyringAccount = await this.#getAccount(accountId);

      if (!keyringAccount) {
        throw new Error('Account not found');
      }

      const transactions = await this.#transactionsService.findByAccounts([
        keyringAccount,
      ]);

      // Find the starting index based on the 'next' signature
      const startIndex = next
        ? transactions.findIndex((tx) => tx.id === next)
        : 0;

      // Get transactions from startIndex to startIndex + limit
      const accountTransactions = transactions.slice(
        startIndex,
        startIndex + limit,
      );

      // Determine the next signature for pagination
      const hasMore = startIndex + pagination.limit < transactions.length;
      const nextSignature = hasMore
        ? ((transactions[startIndex + pagination.limit]?.id as Signature) ??
          null)
        : null;

      return {
        data: accountTransactions,
        next: nextSignature,
      };
    } catch (error: any) {
      this.#logger.error({ error }, 'Error listing account transactions');
      throw new SnapError(error);
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

      const allAccounts = await this.#listAccounts();

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

      const { publicKeyBytes } = await deriveSolanaKeypair({
        entropySource,
        derivationPath,
      });
      const address = decoder.decode(publicKeyBytes.slice(1));

      const activityChecksPromises = [];

      for (const scope of scopes) {
        activityChecksPromises.push(
          this.#transactionsService.fetchLatestSignatures(
            scope as Network,
            address,
            { limit: 1 },
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
      throw new SnapError(error);
    }
  }

  /**
   * Endpoint that the client can use to inform the snap that certain accounts are selected.
   * @param accountIds - The ids of the accounts to set as selected.
   */
  async setSelectedAccounts(accountIds: string[]): Promise<void> {
    validateRequest(accountIds, array(UuidStruct));

    const existingIds = new Set(
      (await this.#listAccounts()).map((account) => account.id),
    );
    if (!accountIds.every((id) => existingIds.has(id))) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw new InvalidParamsError(
        'Account IDs were not part of existing accounts.',
      );
    }

    await this.#keyringAccountMonitor.setMonitoredAccounts(accountIds);
  }

  /**
   * Exports an account from the state.
   * @param accountId - The id of the account to export.
   * @param options - The options for the export.
   * @returns The exported account.
   */
  async exportAccount(accountId: string, options: ExportAccountOptions): Promise<ExportedAccount> {
    try {
      validateRequest({ accountId, options }, ExportAccountRequestStruct);

      const account = await this.getAccountOrThrow(accountId);

      const { privateKeyBytes, publicKeyBytes } = await deriveSolanaKeypair({
        entropySource: account.entropySource,
        derivationPath: account.derivationPath,
      });

      // Solana convention: 64-byte secret key = seed(32) || publicKey(32).
      // publicKeyBytes is 33 bytes due to the SLIP-10 0x00 prefix; strip it.
      const secretKey = new Uint8Array(64);

      secretKey.set(privateKeyBytes, 0);
      secretKey.set(publicKeyBytes.slice(1), 32);

      const privateKey =
        options.encoding === 'base58'
          ? bs58.encode(secretKey)
          : bytesToHex(secretKey); // returns 0x-prefixed hex

      assertStruct(privateKey, union([Base58Struct, HexStruct]), 'Invalid private key encoding');

      return {
        type: 'private-key',
        encoding: options.encoding,
        privateKey,
      };
    } catch (error: any) {
      this.#logger.error({ error }, 'Error exporting account');
      throw new SnapError(error);
    }
  }
}
