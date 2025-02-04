/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
import type { Transaction } from '@metamask/keyring-api';
import {
  KeyringEvent,
  SolAccountType,
  SolMethod,
  SolScopes,
  type Balance,
  type CaipAssetType,
  type Keyring,
  type KeyringAccount,
  type KeyringRequest,
  type KeyringResponse,
} from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { Json } from '@metamask/snaps-controllers';
import { MethodNotFoundError } from '@metamask/snaps-sdk';
import type { Signature } from '@solana/web3.js';
import {
  address as asAddress,
  createKeyPairFromPrivateKeyBytes,
  createKeyPairSignerFromPrivateKeyBytes,
  getAddressFromPublicKey,
} from '@solana/web3.js';

import type { SolanaTokenMetadata } from '../../clients/token-metadata-client/types';
import type { Network } from '../../constants/solana';
import { SOL_SYMBOL, SolanaCaip19Tokens } from '../../constants/solana';
import { lamportsToSol } from '../../utils/conversion';
import { deriveSolanaPrivateKey } from '../../utils/deriveSolanaPrivateKey';
import { fromTokenUnits } from '../../utils/fromTokenUnit';
import { getLowestUnusedIndex } from '../../utils/getLowestUnusedIndex';
import { getNetworkFromToken } from '../../utils/getNetworkFromToken';
import type { ILogger } from '../../utils/logger';
import type { SendAndConfirmTransactionParams } from '../../validation/structs';
import {
  DeleteAccountStruct,
  GetAccounBalancesResponseStruct,
  GetAccountBalancesStruct,
  GetAccountStruct,
  ListAccountAssetsResponseStruct,
  ListAccountAssetsStruct,
  ListAccountTransactionsStruct,
  SendAndConfirmTransactionParamsStruct,
  SubmitRequestMethodStruct,
} from '../../validation/structs';
import { validateRequest, validateResponse } from '../../validation/validators';
import type { AssetsService } from '../assets/Assets';
import type { ConfigProvider } from '../config';
import type { EncryptedSolanaState } from '../encrypted-state/EncryptedState';
import type { TransactionHelper } from '../execution/TransactionHelper';
import type { SolanaState } from '../state/State';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import type { TransactionsService } from '../transactions/Transactions';

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

  readonly #configProvider: ConfigProvider;

  readonly #encryptedState: EncryptedSolanaState;

  readonly #logger: ILogger;

  readonly #transactionsService: TransactionsService;

  readonly #assetsService: AssetsService;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #transactionHelper: TransactionHelper;

  constructor({
    state,
    configProvider,
    encryptedState,
    logger,
    transactionsService,
    transactionHelper,
    assetsService,
    tokenMetadataService,
  }: {
    state: SolanaState;
    configProvider: ConfigProvider;
    encryptedState: EncryptedSolanaState;
    logger: ILogger;
    transactionsService: TransactionsService;
    transactionHelper: TransactionHelper;
    assetsService: AssetsService;
    tokenMetadataService: TokenMetadataService;
  }) {
    this.#state = state;
    this.#configProvider = configProvider;
    this.#encryptedState = encryptedState;
    this.#logger = logger;
    this.#transactionsService = transactionsService;
    this.#transactionHelper = transactionHelper;
    this.#assetsService = assetsService;
    this.#tokenMetadataService = tokenMetadataService;
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

  async getAccount(
    accountId: string,
  ): Promise<SolanaKeyringAccount | undefined> {
    try {
      validateRequest({ accountId }, GetAccountStruct);

      const currentState = await this.#encryptedState.get();
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
  }): Promise<SolanaKeyringAccount> {
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

      const privateKeyBytes = await deriveSolanaPrivateKey(index);
      const privateKeyBytesAsNum = Array.from(privateKeyBytes);

      const keyPair = await createKeyPairFromPrivateKeyBytes(privateKeyBytes);
      const accountAddress = await getAddressFromPublicKey(keyPair.publicKey);

      // Filter out our special properties from options
      const { importedAccount, index: _, ...remainingOptions } = options ?? {};

      const keyringAccount: SolanaKeyringAccount = {
        id,
        index,
        privateKeyBytesAsNum,
        type: SolAccountType.DataAccount,
        address: accountAddress,
        scopes: [SolScopes.Mainnet, SolScopes.Testnet, SolScopes.Devnet],
        options: {
          ...remainingOptions,
          imported: importedAccount ?? false,
        },
        methods: [SolMethod.SendAndConfirmTransaction],
      };

      await this.emitEvent(KeyringEvent.AccountCreated, {
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
          scopes: keyringAccount.scopes,
        },
        accountNameSuggestion: `Solana Account ${index + 1}`,
      });

      await this.#encryptedState.update((state) => ({
        ...state,
        keyringAccounts: {
          ...(state?.keyringAccounts ?? {}),
          [keyringAccount.id]: keyringAccount,
        },
      }));

      return keyringAccount;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error creating account');
      throw new Error('Error creating account');
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    try {
      validateRequest({ accountId }, DeleteAccountStruct);

      await Promise.all([
        this.#encryptedState.update((state) => {
          delete state?.keyringAccounts?.[accountId];
          return state;
        }),
        this.#state.update((state) => {
          delete state?.transactions?.[accountId];
          return state;
        }),
      ]);
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
   * Returns the balances of the given account for the given assets.
   * @param accountId - The id of the account.
   * @param assets - The assets to get the balances for (CAIP-19 ids).
   * @returns The balances of the account for the given assets.
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
          await this.#tokenMetadataService.getMultipleTokenMetadata(
            tokenAssets.map((token) => token.address),
          );

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
                unit: tokenMetadata[splToken.address]?.symbol ?? '',
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
    const { method } = request.request;

    validateRequest(method, SubmitRequestMethodStruct);

    const methodToHandler: Record<
      SolMethod,
      (request: KeyringRequest) => Promise<Json>
    > = {
      [SolMethod.SendAndConfirmTransaction]:
        this.handleSendAndConfirmTransaction.bind(this),
    };

    if (!(method in methodToHandler)) {
      throw new MethodNotFoundError(
        `Unsupported method: ${method}`,
      ) as unknown as Error;
    }

    return methodToHandler[method as SolMethod](request);
  }

  async handleSendAndConfirmTransaction(
    request: KeyringRequest,
  ): Promise<{ signature: string }> {
    const { scope, account: accountId } = request;
    const { params } = request.request;

    validateRequest(params, SendAndConfirmTransactionParamsStruct);

    const { base64EncodedTransactionMessage } =
      params as SendAndConfirmTransactionParams;

    const account = await this.getAccountOrThrow(accountId);
    const signer = await createKeyPairSignerFromPrivateKeyBytes(
      Uint8Array.from(account.privateKeyBytesAsNum),
    );

    const decodedTransactionMessage =
      await this.#transactionHelper.base64DecodeTransaction(
        base64EncodedTransactionMessage,
        scope as Network,
      );

    const signature = await this.#transactionHelper.sendTransaction(
      decodedTransactionMessage,
      [signer],
      scope as Network,
    );

    return { signature };
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
}
