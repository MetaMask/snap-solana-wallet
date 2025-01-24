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
import { MethodNotFoundError, type Json } from '@metamask/snaps-sdk';
import type { Signature } from '@solana/web3.js';
import {
  address as asAddress,
  createKeyPairFromPrivateKeyBytes,
  createKeyPairSignerFromPrivateKeyBytes,
  getAddressFromPublicKey,
} from '@solana/web3.js';

import { SOL_SYMBOL, type Network } from '../../constants/solana';
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

  async getAccount(id: string): Promise<SolanaKeyringAccount | undefined> {
    try {
      validateRequest(id, GetAccountStruct);

      const currentState = await this.#encryptedState.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};

      if (!keyringAccounts[id]) {
        throw new Error(`Account "${id}" not found`);
      }

      return keyringAccounts?.[id];
    } catch (error: any) {
      this.#logger.error({ error }, 'Error getting account');
      throw error;
    }
  }

  async getAccountOrThrow(id: string): Promise<SolanaKeyringAccount> {
    const account = await this.getAccount(id);
    if (!account) {
      throw new Error(`Account "${id}" not found`);
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
        scopes: [SolScopes.Mainnet, SolScopes.Testnet, SolScopes.Devnet],
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
          scopes: keyringAccount.scopes,
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
            asAddress(keyringAccount.address),
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
      validateRequest(id, DeleteAccountStruct);

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
      throw error;
    }
  }

  /**
   * Returns the list of assets for the given account in all Solana networks.
   * @param id - The id of the account.
   * @returns CAIP-19 assets ids.
   */
  async listAccountAssets(id: string): Promise<CaipAssetType[]> {
    try {
      validateRequest(id, ListAccountAssetsStruct);

      const account = await this.getAccount(id);
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

      const nativeAssets = this.#assetsService
        .filterZeroBalanceTokens(nativeResponses)
        .map((response) => response.address);

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
   * @param id - The id of the account.
   * @param assets - The assets to get the balances for (CAIP-19 ids).
   * @returns The balances of the account for the given assets.
   */
  async getAccountBalances(
    id: string,
    assets: CaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    try {
      validateRequest({ id, assets }, GetAccountBalancesStruct);

      const account = await this.getAccount(id);
      const balances = new Map<string, Balance>();

      if (!account) {
        throw new Error('Account not found');
      }

      const assetsByNetwork = assets.reduce<Record<Network, string[]>>(
        (groups, asset) => {
          const network = getNetworkFromToken(asset);

          if (!groups[network]) {
            groups[network] = [];
          }

          groups[network].push(asset);
          return groups;
        },
        {} as Record<Network, string[]>,
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
          if (asset.endsWith('slip44:501')) {
            balances.set(asset, {
              amount: lamportsToSol(nativeAsset.balance).toString(),
              unit: SOL_SYMBOL,
            });
          } else {
            const splToken = tokenAssets.find(
              (token) => token.address === asset,
            );

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
        };
      });

      return result;
    } catch (error: any) {
      this.#logger.error({ error }, 'Error getting account balances');
      throw error;
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

    validateRequest(method, SubmitRequestMethodStruct);

    const methodToHandler: Record<
      SolMethod,
      (request: KeyringRequest) => Promise<Json>
    > = {
      [SolMethod.SendAndConfirmTransaction]:
        this.handleSendAndConfirmTransaction.bind(this),
      // Register other handlers here
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
      await this.#transactionHelper.base64DecodeTransactionMessage(
        base64EncodedTransactionMessage,
      );

    const signature = await this.#transactionHelper.sendTransaction(
      decodedTransactionMessage,
      [signer],
      scope as Network,
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
    validateRequest({ accountId, pagination }, ListAccountTransactionsStruct);

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
