import { KeyringEvent, type Transaction } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { CaipAssetType } from '@metamask/utils';
import type { Address, Commitment, Signature, Slot } from '@solana/kit';
import { address as asAddress, signature as asSignature } from '@solana/kit';
import { get, groupBy } from 'lodash';

import type { AssetEntity } from '../../../entities';
import type { SolanaKeyringAccount } from '../../../entities/keyring-account';
import { type Network } from '../../constants/solana';
import type { SolanaTransaction } from '../../types/solana';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import type { AccountsService } from '../accounts';
import type { AssetsService } from '../assets/AssetsService';
import type { AssetMetadata } from '../assets/types';
import type { SolanaConnection } from '../connection';
import type { TransactionsRepository } from './TransactionsRepository';
import { isSpam } from './utils/isSpam';
import { mapRpcTransaction } from './utils/mapRpcTransaction';

export class TransactionsService {
  readonly #transactionsRepository: TransactionsRepository;

  readonly #accountsService: AccountsService;

  readonly #assetsService: AssetsService;

  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  constructor(
    transactionsRepository: TransactionsRepository,
    accountsService: AccountsService,
    assetsService: AssetsService,
    connection: SolanaConnection,
    logger: ILogger,
  ) {
    this.#transactionsRepository = transactionsRepository;
    this.#accountsService = accountsService;
    this.#assetsService = assetsService;
    this.#connection = connection;
    this.#logger = createPrefixedLogger(logger, '[💱 TransactionsService]');
  }

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

    return this.#mapRpcTransactionToKeyringTransaction(
      transactionData,
      account,
      scope,
    );
  }

  /**
   * Fetches the transactions for the given assets.
   * Only fetches the transactions that are not already in the state.
   *
   * @param assets - The assets to fetch the transactions for.
   * @param options - The options for the fetch.
   * @param options.limit - The maximum number of transactions to fetch.
   * @returns The transactions for the given assets.
   */
  async fetchAssetsTransactions(
    assets: AssetEntity[],
    options?: {
      limit?: number;
    },
  ): Promise<Transaction[]> {
    const accounts = await this.#accountsService.getAll();

    const findAccountById = (id: string) =>
      accounts.find((account) => account.id === id);

    const assetTypes = assets.map((asset) => asset.assetType);

    const assetsMetadata =
      await this.#assetsService.getAssetsMetadata(assetTypes);

    const savedTransactions = await this.#transactionsRepository.getAll();

    const findLatestTransactionForAsset = async (asset: AssetEntity) => {
      const { network } = asset;
      const addressOrMint = 'mint' in asset ? asset.mint : asset.address;

      const existingTransaction = savedTransactions
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
        .find(
          (tx) =>
            tx.from.some(
              (from) =>
                tokenAddressToCaip19(network, addressOrMint) ===
                get(from, 'asset.type'),
            ) ||
            tx.to.some(
              (to) =>
                tokenAddressToCaip19(network, addressOrMint) ===
                get(to, 'asset.type'),
            ),
        );

      if (!existingTransaction) {
        return null;
      }

      return existingTransaction;
    };

    type SignatureWithAsset = {
      signatureResponse: {
        signature: Signature;
        blockTime: number;
      };
      asset: AssetEntity;
    };

    const fetchSignaturesForAsset = async (
      asset: AssetEntity,
    ): Promise<SignatureWithAsset[]> => {
      const { network } = asset;
      const addressOrPubkey = 'pubkey' in asset ? asset.pubkey : asset.address;

      const latestTransaction = await findLatestTransactionForAsset(asset);

      const latestSignature = latestTransaction
        ? asSignature(latestTransaction?.id)
        : undefined;

      const response = await this.#connection
        .getRpc(network)
        .getSignaturesForAddress(asAddress(addressOrPubkey), {
          limit: 5,
          ...(latestSignature ? { until: latestSignature } : {}),
        })
        .send();

      return response.map((item) => ({
        signatureResponse: {
          signature: item.signature,
          blockTime: Number(item.blockTime ?? 0),
        },
        asset,
      }));
    };

    const signatures = (
      await Promise.all(assets.map(fetchSignaturesForAsset))
    ).flat();

    // If limit is provided, only fetch the most recent signatures with the limit
    const signaturesToFetch = options?.limit
      ? signatures
          .sort(
            (a, b) =>
              (b.signatureResponse.blockTime ?? 0) -
              (a.signatureResponse.blockTime ?? 0),
          )
          .slice(0, options.limit)
      : signatures;

    type TransactionWithAsset = {
      transaction: SolanaTransaction | null;
      asset: AssetEntity;
    };

    const fetchTransaction = async (
      signatureWithAsset: SignatureWithAsset,
    ): Promise<TransactionWithAsset | null> => {
      try {
        const { signatureResponse, asset } = signatureWithAsset;
        const transaction = await this.#connection
          .getRpc(asset.network)
          .getTransaction(asSignature(signatureResponse.signature), {
            maxSupportedTransactionVersion: 0,
          })
          .send();
        return {
          transaction,
          asset,
        };
      } catch (error) {
        return null;
      }
    };

    const transactions = (
      await Promise.all(signaturesToFetch.map(fetchTransaction))
    ).filter((item) => item !== null);

    const mapTransaction = async (
      transactionWithAsset: TransactionWithAsset,
    ) => {
      const { transaction, asset } = transactionWithAsset;
      if (!transaction) {
        return null;
      }
      const account = findAccountById(asset.keyringAccountId);
      if (!account) {
        return null;
      }
      return this.#mapRpcTransactionToKeyringTransaction(
        transaction,
        account,
        asset.network,
        assetsMetadata,
      );
    };

    const mappedTransactions = (
      await Promise.all(transactions.map(mapTransaction))
    )
      .filter((item) => item !== null)
      .filter((item) => {
        const account = findAccountById(item.account);
        if (!account) {
          return false;
        }
        return !isSpam(item, account);
      });

    return mappedTransactions;
  }

  async fetchLatestSignatures(
    scope: Network,
    address: Address,
    config?: {
      /** start searching backwards from this transaction signature. If not provided the search starts from the top of the highest max confirmed block. */
      before?: Signature;
      commitment?: Exclude<Commitment, 'processed'>;
      /** maximum transaction signatures to return (between 1 and 1,000). Default: 1000 */
      limit?: number;
      /** The minimum slot that the request can be evaluated at */
      minContextSlot?: Slot;
      /** search until this transaction signature, if found before limit reached */
      until?: Signature;
    },
  ): Promise<Signature[]> {
    const signatureResponses = await this.#connection
      .getRpc(scope)
      .getSignaturesForAddress(address, config)
      .send();
    const signatures = signatureResponses.map(({ signature }) => signature);

    return signatures;
  }

  async findByAccounts(
    accounts: SolanaKeyringAccount[],
  ): Promise<Transaction[]> {
    const transactions = await Promise.all(
      accounts.map(async (account) =>
        this.#transactionsRepository.findByAccountId(account.id),
      ),
    );

    return transactions.flat();
  }

  async save(transaction: Transaction): Promise<void> {
    await this.saveMany([transaction]);
  }

  async saveMany(transactions: Transaction[]): Promise<void> {
    await this.#transactionsRepository.saveMany(transactions);

    const transactionsByAccountId = groupBy(transactions, 'account');

    await emitSnapKeyringEvent(snap, KeyringEvent.AccountTransactionsUpdated, {
      transactions: transactionsByAccountId,
    });
  }

  async #mapRpcTransactionToKeyringTransaction(
    transactionData: SolanaTransaction | null,
    account: SolanaKeyringAccount,
    scope: Network,
    assetsMetadata?: Record<string, AssetMetadata | null>,
  ): Promise<Transaction | null> {
    if (!transactionData) {
      return null;
    }

    const mappedTransaction = mapRpcTransaction({
      transactionData,
      account,
      scope,
    });

    if (!mappedTransaction) {
      return null;
    }

    const caip19Ids = [
      ...new Set(
        [...mappedTransaction.from, ...mappedTransaction.to]
          .filter((item) => item.asset?.fungible)
          .map((item) => (item.asset as { type: CaipAssetType }).type),
      ),
    ];

    const assetsMetadataToUse =
      assetsMetadata ??
      (await this.#assetsService.getAssetsMetadata(caip19Ids));

    mappedTransaction.from.forEach((from) => {
      if (from.asset?.fungible && assetsMetadataToUse[from.asset.type]) {
        from.asset.unit = assetsMetadataToUse[from.asset.type]?.symbol ?? '';
      }
    });

    mappedTransaction.to.forEach((to) => {
      if (to.asset?.fungible && assetsMetadataToUse[to.asset.type]) {
        to.asset.unit = assetsMetadataToUse[to.asset.type]?.symbol ?? '';
      }
    });

    return mappedTransaction;
  }
}
