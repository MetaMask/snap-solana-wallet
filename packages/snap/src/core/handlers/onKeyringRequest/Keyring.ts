/* eslint-disable no-void */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
import {
  KeyringEvent,
  ResolveAccountAddressRequestStruct,
  SolAccountType,
  SolMethod,
  SolScope,
  type Balance,
  type CaipAssetType,
  type Keyring,
  type KeyringAccount,
  type KeyringRequest,
  type KeyringResponse,
  type ResolvedAccountAddress,
  type Transaction,
} from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { Json } from '@metamask/snaps-controllers';
import type { JsonRpcRequest } from '@metamask/snaps-sdk';
import { MethodNotFoundError } from '@metamask/snaps-sdk';
import { assert, enums } from '@metamask/superstruct';
import type { CaipChainId } from '@metamask/utils';
import type { Signature } from '@solana/web3.js';
import {
  address as asAddress,
  createKeyPairSignerFromPrivateKeyBytes,
  getAddressDecoder,
} from '@solana/web3.js';

import {
  DEFAULT_CONFIRMATION_CONTEXT,
  renderConfirmation,
} from '../../../features/confirmation/renderConfirmation';
import type { SolanaTokenMetadata } from '../../clients/token-metadata-client/types';
import type { Network } from '../../constants/solana';
import { SOL_SYMBOL, SolanaCaip19Tokens } from '../../constants/solana';
import type { AssetsService } from '../../services/assets/AssetsService';
import type { ConfigProvider } from '../../services/config';
import type { EncryptedState } from '../../services/encrypted-state/EncryptedState';
import type { FromBase64EncodedBuilder } from '../../services/execution/builders/FromBase64EncodedBuilder';
import type { TransactionHelper } from '../../services/execution/TransactionHelper';
import type { TokenMetadataService } from '../../services/token-metadata/TokenMetadata';
import type { TransactionsService } from '../../services/transactions/Transactions';
import { mapRpcTransaction } from '../../services/transactions/utils/mapRpcTransaction';
import { SolanaWalletRequestStruct } from '../../services/wallet/structs';
import type { WalletService } from '../../services/wallet/WalletService';
import { lamportsToSol } from '../../utils/conversion';
import { deriveSolanaPrivateKey } from '../../utils/deriveSolanaPrivateKey';
import { fromTokenUnits } from '../../utils/fromTokenUnit';
import { getLowestUnusedIndex } from '../../utils/getLowestUnusedIndex';
import { getNetworkFromToken } from '../../utils/getNetworkFromToken';
import type { ILogger } from '../../utils/logger';
import {
  DeleteAccountStruct,
  GetAccounBalancesResponseStruct,
  GetAccountBalancesStruct,
  GetAccountStruct,
  ListAccountAssetsResponseStruct,
  ListAccountAssetsStruct,
  ListAccountTransactionsStruct,
  NetworkStruct,
  SendAndConfirmTransactionParamsStruct,
  UuidStruct,
} from '../../validation/structs';
import { validateRequest, validateResponse } from '../../validation/validators';
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

  readonly #configProvider: ConfigProvider;

  readonly #logger: ILogger;

  readonly #transactionsService: TransactionsService;

  readonly #assetsService: AssetsService;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #transactionHelper: TransactionHelper;

  readonly #walletService: WalletService;

  readonly #fromBase64EncodedBuilder: FromBase64EncodedBuilder;

  constructor({
    state,
    configProvider,
    logger,
    transactionsService,
    transactionHelper,
    assetsService,
    tokenMetadataService,
    walletService,
    fromBase64EncodedBuilder,
  }: {
    state: EncryptedState;
    configProvider: ConfigProvider;
    logger: ILogger;
    transactionsService: TransactionsService;
    transactionHelper: TransactionHelper;
    assetsService: AssetsService;
    tokenMetadataService: TokenMetadataService;
    walletService: WalletService;
    fromBase64EncodedBuilder: FromBase64EncodedBuilder;
  }) {
    this.#state = state;
    this.#configProvider = configProvider;
    this.#logger = logger;
    this.#transactionsService = transactionsService;
    this.#transactionHelper = transactionHelper;
    this.#assetsService = assetsService;
    this.#tokenMetadataService = tokenMetadataService;
    this.#walletService = walletService;
    this.#fromBase64EncodedBuilder = fromBase64EncodedBuilder;
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
  }): Promise<KeyringAccount> {
    try {
      // eslint-disable-next-line no-restricted-globals
      const id = crypto.randomUUID();

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
      const { importedAccount, index: _, ...remainingOptions } = options ?? {};

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
        methods: [SolMethod.SendAndConfirmTransaction],
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
        accountNameSuggestion: `Solana Account ${index + 1}`,
      });

      return keyringAccount;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error creating account');
      throw new Error('Error creating account');
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    try {
      validateRequest({ accountId }, DeleteAccountStruct);

      await this.#state.update((state) => {
        delete state?.keyringAccounts?.[accountId];
        delete state?.assets?.[accountId];
        delete state?.transactions?.[accountId];
        return state;
      });

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

      const account = await this.getAccount(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      const { activeNetworks } = this.#configProvider.get();

      const nativeResponses = await Promise.all(
        activeNetworks.map(async (network) =>
          this.#assetsService.getNativeAsset(account.address, network),
        ),
      );

      const tokensResponses = await Promise.all(
        activeNetworks.map(async (network) =>
          this.#assetsService.discoverTokens(account.address, network),
        ),
      );

      const nativeAssets = nativeResponses.map((response) => response.address);

      const tokenAssets = tokensResponses.flatMap((response) =>
        response.map((token) => token.address),
      );

      const result = [...nativeAssets, ...tokenAssets] as CaipAssetType[];

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

      const account = await this.getAccount(accountId);
      const balances = new Map<CaipAssetType, Balance>();
      const metadata = new Map<CaipAssetType, SolanaTokenMetadata>();

      if (!account) {
        throw new Error('Account not found');
      }

      const assetsByNetwork = assets.reduce<Record<Network, CaipAssetType[]>>(
        (groups, asset) => {
          const network = getNetworkFromToken(asset);

          if (!groups[network]) {
            groups[network] = [];
          }

          groups[network].push(asset);
          return groups;
        },
        {} as Record<Network, CaipAssetType[]>,
      );

      for (const network of Object.keys(assetsByNetwork)) {
        const currentNetwork = network as Network;
        const networkAssets = assetsByNetwork[currentNetwork];

        const [nativeAsset, tokenAssets] = await Promise.all([
          this.#assetsService.getNativeAsset(account.address, currentNetwork),
          this.#assetsService.discoverTokens(account.address, currentNetwork),
        ]);

        const tokenMetadata =
          await this.#tokenMetadataService.getTokensMetadata([
            nativeAsset.address,
            ...tokenAssets.map((token) => token.address),
          ]);

        for (const asset of networkAssets) {
          // update token metadata if exist
          if (tokenMetadata[asset]) {
            metadata.set(asset, tokenMetadata[asset]);
          }

          if (asset.endsWith(SolanaCaip19Tokens.SOL)) {
            // update native asset balance
            balances.set(asset, {
              amount: lamportsToSol(nativeAsset.balance).toString(),
              unit: SOL_SYMBOL,
            });
          } else {
            const splToken = tokenAssets.find(
              (token) => token.address === asset,
            );

            // update spl token balance if exist
            if (splToken) {
              balances.set(asset, {
                amount: fromTokenUnits(splToken.balance, splToken.decimals),
                unit: tokenMetadata[splToken.address]?.symbol ?? 'UNKNOWN',
              });
            }
          }
        }
      }

      const result = Object.fromEntries(balances.entries());

      validateResponse(result, GetAccounBalancesResponseStruct);

      await this.#state.update((state) => {
        return {
          ...state,
          assets: {
            ...(state?.assets ?? {}),
            [account.id]: result,
          },
          metadata: {
            ...(state?.metadata ?? {}),
            ...Object.fromEntries(metadata.entries()),
          },
        };
      });

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

    const isConfirmed = await renderConfirmation({
      ...DEFAULT_CONFIRMATION_CONTEXT,
      scope,
      method,
      transaction: base64EncodedTransaction,
      account,
    });

    if (!isConfirmed) {
      return null;
    }

    switch (method) {
      case SolMethod.SignAndSendTransaction:
        return this.#walletService.signAndSendTransaction(account, request);
      default:
        throw new MethodNotFoundError(
          `Unsupported method: ${method}`,
        ) as unknown as Error;
    }
  }

  async handleSendAndConfirmTransaction(
    request: KeyringRequest,
  ): Promise<{ signature: string } | null> {
    const { scope, account: accountId } = request;
    assert(scope, NetworkStruct);
    assert(accountId, UuidStruct);

    const { params, method } = request.request;
    validateRequest(params, SendAndConfirmTransactionParamsStruct);
    assert(method, enums(Object.values(SolMethod)));

    const { base64EncodedTransactionMessage: base64EncodedTransaction } =
      params;

    const account = await this.getAccountOrThrow(accountId);

    try {
      const transactionMessage =
        await this.#fromBase64EncodedBuilder.buildTransactionMessage(
          base64EncodedTransaction,
          scope,
        );

      const { privateKeyBytes } = await deriveSolanaPrivateKey(account.index);
      const signer = await createKeyPairSignerFromPrivateKeyBytes(
        privateKeyBytes,
      );

      const signature = await this.#transactionHelper.sendTransaction(
        transactionMessage,
        [signer],
        scope,
      );

      const transaction =
        await this.#transactionHelper.waitForTransactionCommitment(
          signature,
          'confirmed',
          scope,
        );

      const mappedTransaction = mapRpcTransaction({
        scope,
        address: asAddress(account.address),
        transactionData: transaction,
      });

      const mappedTransactionWithAccountId = {
        ...mappedTransaction,
        account: accountId,
      };

      await this.emitEvent(KeyringEvent.AccountTransactionsUpdated, {
        transactions: {
          [accountId]: [mappedTransactionWithAccountId],
        },
      });

      return { signature };
    } catch (error: any) {
      this.#logger.error({ error }, 'Error sending and confirming transaction');
      throw error;
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
