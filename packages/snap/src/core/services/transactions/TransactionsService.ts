import {
  KeyringEvent,
  type CaipAssetType,
  type Transaction,
} from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import {
  address as asAddress,
  signature as asSignature,
  type Address,
  type Signature,
} from '@solana/kit';
import { uniq, uniqBy } from 'lodash';

import type { SolanaKeyringAccount } from '../../../entities';
import { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { ConfigProvider } from '../config';
import type { SolanaConnection } from '../connection';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import type { SignatureMapping } from './types';
import { isSpam } from './utils/isSpam';
import { mapRpcTransaction } from './utils/mapRpcTransaction';

export class TransactionsService {
  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #state: IStateManager<UnencryptedStateValue>;

  readonly #configProvider: ConfigProvider;

  constructor({
    logger,
    connection,
    tokenMetadataService,
    state,
    configProvider,
  }: {
    logger: ILogger;
    connection: SolanaConnection;
    tokenMetadataService: TokenMetadataService;
    state: IStateManager<UnencryptedStateValue>;
    configProvider: ConfigProvider;
  }) {
    this.#connection = connection;
    this.#tokenMetadataService = tokenMetadataService;
    this.#logger = logger;
    this.#state = state;
    this.#configProvider = configProvider;
  }

  async fetchLatestAccountTransactions(
    account: SolanaKeyringAccount,
    limit: number,
  ) {
    const scopes = this.#configProvider.get().activeNetworks;

    const transactions = (
      await Promise.all(
        scopes.map(async (scope) =>
          this.#fetchAccountTransactions(account, scope, {
            limit,
          }),
        ),
      )
    )
      .flatMap(({ data }) => data)
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

    return transactions;
  }

  async #fetchAccountTransactions(
    account: SolanaKeyringAccount,
    scope: Network,
    pagination: { limit: number; next?: Signature | null },
  ): Promise<{
    data: Transaction[];
    next: Signature | null;
  }> {
    const { address } = account;
    const addressAsAddress = asAddress(address);

    // First fetch the signatures
    const signatures = (
      await this.#connection
        .getRpc(scope)
        .getSignaturesForAddress(
          addressAsAddress,
          pagination.next
            ? {
                limit: pagination.limit,
                before: pagination.next,
              }
            : { limit: pagination.limit },
        )
        .send()
    ).map(({ signature }) => signature);

    const existingSinatures =
      (await this.#state.getKey<Signature[]>(`signatures.${address}`)) ?? [];

    await this.#state.setKey(`signatures.${address}`, [
      ...new Set([...existingSinatures, ...signatures]),
    ]);

    // Fetch, clean up and map transactions
    const transactions = (
      await this.getTransactionsDataFromSignatures({
        scope,
        signatures,
      })
    )
      .filter((item) => item !== null)
      .map((transactionData) =>
        mapRpcTransaction({
          transactionData,
          account,
          scope,
        }),
      )
      .filter((item) => !isSpam(item, account));

    const transactionsByAccountWithTokenMetadata =
      await this.#populateAccountTransactionAssetUnits({
        [address]: transactions,
      });

    const next =
      signatures.length === pagination.limit
        ? (signatures[signatures.length - 1] ?? null) // eslint-disable-line prettier/prettier
        : null;

    return {
      data: transactionsByAccountWithTokenMetadata[address] ?? [],
      next,
    };
  }

  async fetchLatestSignatures(
    scope: Network,
    address: Address,
    limit: number,
  ): Promise<Signature[]> {
    this.#logger.log(
      `[TransactionsService.fetchAllSignatures] Fetching all signatures for ${address} on ${scope}`,
    );

    const signatureResponses = await this.#connection
      .getRpc(scope)
      .getSignaturesForAddress(address, {
        limit,
      })
      .send();
    const signatures = signatureResponses.map(({ signature }) => signature);

    const existingSinatures =
      (await this.#state.getKey<Signature[]>(`signatures.${address}`)) ?? [];

    await this.#state.setKey(`signatures.${address}`, [
      ...new Set([...existingSinatures, ...signatures]),
    ]);

    return signatures;
  }

  async getTransactionsDataFromSignatures({
    scope,
    signatures,
  }: {
    scope: Network;
    signatures: Signature[];
  }) {
    const transactionsData = await Promise.all(
      signatures.map(async (signature) =>
        this.#connection
          .getRpc(scope)
          .getTransaction(signature, {
            maxSupportedTransactionVersion: 0,
          })
          .send(),
      ),
    );

    return transactionsData;
  }

  /**
   * Fetches a transaction from the RPC and maps it to the expected format from the Keyring API.
   * @param signature - The signature of the transaction to fetch.
   * @param account - The account that the transaction belongs to.
   * @param scope - The network of the transaction.
   * @returns The mapped transaction or `null` if the transaction is not found.
   */
  async fetchBySignature(
    signature: string,
    account: SolanaKeyringAccount,
    scope: Network,
  ): Promise<Transaction | null> {
    const transactionData = await this.#connection
      .getRpc(scope)
      .getTransaction(asSignature(signature), {
        maxSupportedTransactionVersion: 0,
      })
      .send();

    if (!transactionData) {
      return null;
    }

    return mapRpcTransaction({
      transactionData,
      scope,
      account,
    });
  }

  /**
   * Saves a transaction and its signature to the state.
   * @param transaction - The transaction to save.
   * @param account - The account that the transaction belongs to.
   */
  async saveTransaction(
    transaction: Transaction,
    account: SolanaKeyringAccount,
  ): Promise<void> {
    const { id: accountId, address: accountAddress } = account;
    const { id: signature } = transaction;

    const saveTransaction = async () => {
      const existingTransactions =
        (await this.#state.getKey<Transaction[]>(
          `transactions.${accountId}`,
        )) ?? [];

      // If a there is a transaction with the same signature, override it
      const sameSignatureTransactionIndex = existingTransactions.findIndex(
        (tx) => tx.id === signature,
      );
      if (sameSignatureTransactionIndex !== -1) {
        existingTransactions[sameSignatureTransactionIndex] = transaction;
      }

      const allTransactions = uniqBy(
        [...existingTransactions, transaction],
        'id',
      );

      await this.#state.setKey(`transactions.${accountId}`, allTransactions);
    };

    const saveSignature = async () => {
      const existingSinatures =
        (await this.#state.getKey<Signature[]>(
          `signatures.${accountAddress}`,
        )) ?? [];

      // Skip saving the signature if it already exists in the state
      if (
        existingSinatures
          .map((item) => item.toString())
          .includes(signature.toString())
      ) {
        return;
      }

      const allSignatures = uniq([...existingSinatures, signature]);

      await this.#state.setKey(`signatures.${accountAddress}`, allSignatures);
    };

    await Promise.all([saveTransaction(), saveSignature()]);
  }

  /**
   * Fetches transactions for all accounts in the keyring and updates the state accordingly. Also emits events for any changes.
   * @param accounts - The accounts to refresh transactions for.
   */
  async refreshTransactions(accounts: SolanaKeyringAccount[]) {
    try {
      this.#logger.log(
        `[TransactionsService] Refreshing transactions for ${accounts.length} accounts`,
      );

      if (!accounts.length) {
        this.#logger.log('[TransactionsService] No accounts found');
        return;
      }

      const scopes = this.#configProvider.get().activeNetworks;

      const transactionsByAccount =
        (await this.#state.getKey<UnencryptedStateValue['transactions']>(
          'transactions',
        )) ?? {};

      const existingSignatures = this.#mapExistingSignaturesSet(
        transactionsByAccount,
      );

      const newSignaturesMapping = await this.#collectNewTransactionSignatures({
        scopes,
        accounts,
        existingSignatures,
      });

      const newTransactionsByAccount =
        await this.#fetchAndMapTransactionsPerAccount({
          scopes,
          accounts,
          newSignaturesMapping,
        });

      const newTransactionsByAccountWithTokenMetadata =
        await this.#populateAccountTransactionAssetUnits(
          newTransactionsByAccount,
        );

      await emitSnapKeyringEvent(
        snap,
        KeyringEvent.AccountTransactionsUpdated,
        {
          transactions: newTransactionsByAccountWithTokenMetadata,
        },
      );

      const updatedTransactionsByAccount = this.#mergeSortAndTrimTransactions({
        accounts,
        previousTransactionsByAccount: transactionsByAccount,
        newTransactionsByAccount,
      });

      await this.#state.setKey('transactions', updatedTransactionsByAccount);
    } catch (error) {
      this.#logger.error(
        '[TransactionsService] Error. Releasing lock...',
        error,
      );
    }
  }

  /**
   * Creates a Set of existing transaction signatures for quick lookup.
   * @param transactions - The current state's transactions record, mapping account IDs to their transactions.
   * @returns A Set containing all existing transaction signatures.
   */
  #mapExistingSignaturesSet(
    transactions: Record<string, Transaction[]>,
  ): Set<string> {
    return new Set(
      Object.values(transactions ?? {})
        .flat()
        .map((tx) => tx.id),
    );
  }

  /**
   * Fetches and collects new transaction signatures for all accounts across networks.
   * @param params - Parameters for fetching signatures.
   * @param params.accounts - List of accounts to fetch signatures for.
   * @param params.scopes - List of networks to check.
   * @param params.existingSignatures - Set of already known signatures.
   * @returns Mapping of new signatures by network and account.
   */
  async #collectNewTransactionSignatures({
    scopes = [Network.Mainnet, Network.Devnet],
    accounts,
    existingSignatures,
  }: {
    scopes?: Network[];
    accounts: SolanaKeyringAccount[];
    existingSignatures: Set<string>;
  }): Promise<SignatureMapping> {
    const newSignaturesMapping: SignatureMapping = {
      byNetwork: new Map(scopes.map((scope) => [scope, new Set<string>()])),
      byAccountAndNetwork: new Map(
        accounts.map((account) => [
          account.id,
          new Map(scopes.map((scope) => [scope, new Set<string>()])),
        ]),
      ),
    };

    /**
     * For each account and network, fetch the latest signatures and take note of the
     * ones we need to fetch data for.
     */
    for (const account of accounts) {
      for (const scope of scopes) {
        this.#logger.log(
          `[TransactionsService] Fetching signatures for ${account.address} on ${scope}...`,
        );

        const signatures = await this.fetchLatestSignatures(
          scope,
          asAddress(account.address),
          this.#configProvider.get().transactions.storageLimit,
        );

        /**
         * Filter out existing signatures and store new ones
         */
        const newSignatures = signatures.filter(
          (signature) => !existingSignatures.has(signature),
        );

        if (!newSignatures.length) {
          this.#logger.log(
            `[TransactionsService] Found 0 new signatures out of ${signatures.length} total for address ${account.address} on network ${scope}`,
          );
          continue;
        }

        const networkSet = newSignaturesMapping.byNetwork.get(
          scope,
        ) as Set<string>;
        const accountMap = newSignaturesMapping.byAccountAndNetwork.get(
          account.id,
        ) as Map<Network, Set<string>>;
        const accountNetworkSet = accountMap.get(scope) as Set<string>;

        newSignatures.forEach((signature) => {
          networkSet.add(signature);
          accountNetworkSet.add(signature);
        });

        this.#logger.info(
          `[TransactionsService] Found ${newSignatures.length} new signatures (${signatures.length} total) for ${account.address} on ${scope}`,
        );
      }
    }

    return newSignaturesMapping;
  }

  /**
   * Fetches and maps transactions for all accounts on a per-network basis.
   * @param params - Parameters for fetching and mapping transactions.
   * @param params.scopes - List of networks to process.
   * @param params.accounts - List of accounts to process.
   * @param params.newSignaturesMapping - Mapping of signatures by network and account.
   * @returns Updated transactions record.
   */
  async #fetchAndMapTransactionsPerAccount({
    scopes = [Network.Mainnet, Network.Devnet],
    accounts,
    newSignaturesMapping,
  }: {
    scopes?: Network[];
    accounts: SolanaKeyringAccount[];
    newSignaturesMapping: SignatureMapping;
  }): Promise<Record<string, Transaction[]>> {
    const newTransactions: Record<string, Transaction[]> = {};

    for (const scope of scopes) {
      const networkSet = newSignaturesMapping.byNetwork.get(
        scope,
      ) as Set<string>;

      if (!networkSet.size) {
        continue;
      }

      const networkSignatures = Array.from(networkSet);

      const transactionsData = await this.getTransactionsDataFromSignatures({
        scope,
        signatures: networkSignatures as Signature[],
      });

      // Map fetched transactions to their respective accounts
      for (const account of accounts) {
        if (!newTransactions[account.id]) {
          newTransactions[account.id] = [];
        }

        const accountMap = newSignaturesMapping.byAccountAndNetwork.get(
          account.id,
        ) as Map<Network, Set<string>>;
        const accountNetworkSet = accountMap.get(scope) as Set<string>;

        const accountTransactions = transactionsData
          .filter((item) => item !== null)
          .filter((item) => {
            const signature = item?.transaction?.signatures[0];
            return signature && accountNetworkSet.has(signature);
          })
          .map((transactionData) =>
            mapRpcTransaction({
              transactionData,
              account,
              scope,
            }),
          )
          .filter((item) => !isSpam(item, account));

        newTransactions[account.id]?.push(...accountTransactions);
      }
    }

    return newTransactions;
  }

  /**
   * Merges and sorts transactions for all accounts.
   * @param options - Options for merging and sorting transactions.
   * @param options.accounts - List of accounts to process.
   * @param options.previousTransactionsByAccount - Previous transactions by account.
   * @param options.newTransactionsByAccount - New transactions by account.
   * @returns Updated transactions record.
   */
  #mergeSortAndTrimTransactions({
    accounts,
    previousTransactionsByAccount,
    newTransactionsByAccount,
  }: {
    accounts: SolanaKeyringAccount[];
    previousTransactionsByAccount: Record<string, Transaction[]>;
    newTransactionsByAccount: Record<string, Transaction[]>;
  }): Record<string, Transaction[]> {
    return Object.fromEntries(
      accounts.map((account) => [
        account.id,
        [
          ...(previousTransactionsByAccount[account.id] ?? []),
          ...(newTransactionsByAccount[account.id] ?? []),
        ]
          .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
          .slice(0, this.#configProvider.get().transactions.storageLimit),
      ]),
    );
  }

  /**
   * Populate token metadata on the `from` and `to` arrays of each transaction.
   * 1. Go through each `from` and `to` element and collect all CAIP 19 IDs for the assets that we need metadata for.
   * 2. Fetch the metadata for this array of CAIP 19 IDs.
   * 3. Map the metadata to the `from` and `to` arrays.
   * @param transactionsByAccount - Array of mapped transactions to populate with token metadata.
   * @returns Array of transactions with populated token metadata.
   */
  async #populateAccountTransactionAssetUnits(
    transactionsByAccount: Record<string, Transaction[]>,
  ) {
    const caip19Ids = [
      ...new Set(
        Object.values(transactionsByAccount).flatMap((transactions) =>
          transactions.flatMap(({ from, to }) =>
            [...from, ...to]
              .filter((item) => item.asset?.fungible)
              .map((item) => (item.asset as { type: CaipAssetType }).type),
          ),
        ),
      ),
    ];

    const tokenMetadata =
      await this.#tokenMetadataService.getTokensMetadata(caip19Ids);

    Object.keys(transactionsByAccount).forEach((accountId) => {
      transactionsByAccount[accountId]?.forEach((transaction) => {
        transaction.from.forEach((from) => {
          if (from.asset?.fungible && tokenMetadata[from.asset.type]) {
            from.asset.unit = tokenMetadata[from.asset.type]?.symbol ?? '';
          }
        });

        transaction.to.forEach((to) => {
          if (to.asset?.fungible && tokenMetadata[to.asset.type]) {
            to.asset.unit = tokenMetadata[to.asset.type]?.symbol ?? '';
          }
        });
      });
    });

    return transactionsByAccount;
  }
}
