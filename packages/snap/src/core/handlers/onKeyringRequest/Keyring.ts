/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
import { SLIP10Node } from '@metamask/key-tree';
import type {
  CreateAccountOptions,
  EntropySourceId,
  Pagination,
} from '@metamask/keyring-api';
import {
  AccountCreationType,
  assertCreateAccountOptionIsSupported,
  ListAccountAssetsResponseStruct,
  SolAccountType,
  SolMethod,
  SolScope,
  type Balance,
  type KeyringAccount,
  type KeyringRequest,
  type ResolvedAccountAddress,
  type Transaction,
} from '@metamask/keyring-api';
import type { ExportAccountOptions, ExportedAccount, KeyringSnapRpc } from '@metamask/keyring-api/v2';
import type { CaipAssetType, JsonRpcRequest } from '@metamask/snaps-sdk';
import {
  InvalidParamsError,
  MethodNotFoundError,
  SnapError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import { array, assert, integer, is } from '@metamask/superstruct';
import { type CaipChainId } from '@metamask/utils';
import type { Signature } from '@solana/kit';
import { address as asAddress, getAddressDecoder } from '@solana/kit';
import bs58 from 'bs58';
import { sortBy } from 'lodash';

import snapManifest from '../../../../snap.manifest.json';
import {
  asStrictKeyringAccount,
  type SolanaKeyringAccount,
} from '../../../entities';
import { SolanaCaip19Tokens } from '../../constants/solana';
import type { Network } from '../../constants/solana';
import type {
  AssetsService,
  KeyringAccountMonitor,
  TransactionsService,
} from '../../services';
import type { ConfirmationHandler } from '../../services/confirmation/ConfirmationHandler';
import type { IStateManager } from '../../services/state/IStateManager';
import type { UnencryptedStateValue } from '../../services/state/State';
import {
  type SolanaSignAndSendTransactionResponse,
  type SolanaSignInResponse,
  type SolanaSignMessageResponse,
  type SolanaSignTransactionResponse,
  SolanaWalletRequestStruct,
} from '../../services/wallet/structs';
import type { WalletService } from '../../services/wallet/WalletService';
import {
  deriveSolanaKeypair,
  deriveSolanaKeypairFromCoinTypeNode,
} from '../../utils/deriveSolanaKeypair';
import { trackError } from '../../utils/errors';
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
import { SolanaKeyringRequestStruct } from './structs';

/**
 * A Solana address decoder that we can reuse across the class to avoid instantiating multiple decoders.
 */
const decoder = getAddressDecoder();

const SUPPORTED_SCOPES =
  snapManifest.initialPermissions['endowment:keyring'].capabilities
    .scopes as readonly Network[];

type SubmitRequestResult =
  | SolanaSignAndSendTransactionResponse
  | SolanaSignTransactionResponse
  | SolanaSignMessageResponse
  | SolanaSignInResponse;

export class SolanaKeyring implements KeyringSnapRpc {
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

  async #listAccounts(): Promise<SolanaKeyringAccount[]> {
    try {
      const keyringAccounts =
        (await this.#state.getKey<UnencryptedStateValue['keyringAccounts']>(
          'keyringAccounts',
        )) ?? {};

      return sortBy(Object.values(keyringAccounts), ['entropySource', 'index']);
    } catch (error: any) {
      // Note: we intentionally do not log here. The public callers
      // (`getAccounts`, `createAccounts`, etc.) wrap calls to this helper in
      // their own try/catch with a function-level log call, so logging here
      // would produce duplicate `'Error listing accounts'` entries on every
      // failure. We still rewrite to a stable error message so existing
      // consumers keep their current observable behavior. The
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
   * @returns The accounts.
   */
  async getAccounts(): Promise<KeyringAccount[]> {
    try {
      return (await this.#listAccounts()).map(asStrictKeyringAccount);
    } catch (error: any) {
      this.#logger.error({ error }, 'Error listing accounts');
      throw new SnapError(error);
    }
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

  #getDefaultDerivationPath(index: number): `m/${string}` {
    return `m/44'/501'/${index}'/0'`;
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

  async createAccounts(options: CreateAccountOptions): Promise<KeyringAccount[]> {
    try {
      assertCreateAccountOptionIsSupported(options, [
        `${AccountCreationType.Bip44DeriveIndex}`,
        `${AccountCreationType.Bip44DeriveIndexRange}`,
        `${AccountCreationType.Bip44Discover}`,
      ]);

      await startTrace(this.#traceNameBatch);

      // Get entropy source
      const entropySource =
        options.entropySource ?? (await this.#getDefaultEntropySource());

      // For discovery, only create the account if it has on-chain activity. No
      // activity means we've reached the end of the discoverable accounts, so we
      // return nothing and the client stops discovering.
      if (
        options.type === AccountCreationType.Bip44Discover &&
        !(await this.#hasOnChainActivity(entropySource, options.groupIndex))
      ) {
        await endTrace(this.#traceNameBatch);
        return [];
      }

      // Map existing accounts by group index
      const allAccounts = new Map<number, SolanaKeyringAccount>();
      for (const account of await this.#listAccounts()) {
        if (account.entropySource === entropySource) {
          allAccounts.set(account.index, account);
        }
      }

      // Create a range of group indexes to create accounts for
      let range;
      if (options.type === AccountCreationType.Bip44DeriveIndexRange) {
        range = options.range;
      } else {
        // Bip44DeriveIndex | Bip44Discover — a single group index. Ranges are
        // inclusive, so `from` and `to` are the same.
        range = { from: options.groupIndex, to: options.groupIndex };
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
      throw new SnapError(error);
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
  async getAccountAssets(accountId: string): Promise<CaipAssetType[]> {
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

  async submitRequest(request: KeyringRequest): Promise<SubmitRequestResult> {
    return await this.#handleSubmitRequest(request);
  }

  async #handleSubmitRequest(
    request: KeyringRequest,
  ): Promise<SubmitRequestResult> {
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
  async getAccountTransactions(
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
      await trackError(error);
      this.#logger.error({ error }, 'Error resolving account address');
      return null;
    }
  }

  /**
   * Checks whether the account at the given BIP-44 group index has any on-chain
   * activity across the supported scopes. Drives `bip44:discover` account
   * creation in {@link createAccounts}.
   *
   * The account is derived using the BIP-44 derivation path
   * `m/44'/501'/${groupIndex}'/0'`, applied to the SRP referenced by the entropy
   * source.
   *
   * @param entropySource - The entropy source aka Recovery Phrase.
   * @param groupIndex - The group index to check for on-chain activity.
   * @returns `true` if the derived address has at least one signature on any
   * supported scope, `false` otherwise.
   */
  async #hasOnChainActivity(
    entropySource: EntropySourceId,
    groupIndex: number,
  ): Promise<boolean> {
    const derivationPath = this.#getDefaultDerivationPath(groupIndex);

    const { publicKeyBytes } = await deriveSolanaKeypair({
      entropySource,
      derivationPath,
    });
    const address = decoder.decode(publicKeyBytes.slice(1));

    const scopeSignatures = await Promise.all(
      SUPPORTED_SCOPES.map(async (scope) =>
        this.#transactionsService.fetchLatestSignatures(scope, address, {
          limit: 1,
        }),
      ),
    );

    return scopeSignatures.some((signatures) => signatures.length > 0);
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
   * Exports an account from the state. This is used to export the private key of an account.
   * This method is only triggered by the client when the user requests to export the private key of an account.
   * 
   * @param accountId - The id of the account to export.
   * @param options - The options for the export.
   * @returns The exported account.
   */
  async exportAccount(accountId: string, options?: ExportAccountOptions): Promise<ExportedAccount> {
    validateRequest({ accountId, options }, ExportAccountRequestStruct);

    const account = await this.getAccountOrThrow(accountId);

    const encoding = options?.encoding ?? 'base58';
    if (encoding !== 'base58') {
      throw new Error('Only base58 private key export is supported');
    }

    try {
      const { privateKeyBytes, publicKeyBytes } = await deriveSolanaKeypair({
        entropySource: account.entropySource,
        derivationPath: account.derivationPath,
      });

      // Solana convention: 64-byte secret key = seed(32) || publicKey(32).
      // publicKeyBytes is 33 bytes due to the SLIP-10 0x00 prefix; strip it.
      const secretKey = new Uint8Array(64);

      secretKey.set(privateKeyBytes, 0);
      secretKey.set(publicKeyBytes.slice(1), 32);

      const privateKey = bs58.encode(secretKey);

      // SECURITY: Use a boolean `is` check rather than an asserting validator
      // here. A `StructError` thrown on failure would embed the offending value
      // — the private key itself — in its message, leaking it into logs and to
      // the caller. `is` returns a boolean, so we throw a value-free message.
      if (!is(privateKey, Base58Struct)) {
        throw new Error('Derived private key failed encoding validation');
      }

      return {
        type: 'private-key',
        encoding,
        privateKey,
      };
    } catch (error: any) {
      const errorMsg = 'Error exporting account'
      this.#logger.error(errorMsg);
      throw new SnapError(errorMsg);
    }
  }
}
