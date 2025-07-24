import { KeyringEvent, type Transaction } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { CaipAssetType } from '@metamask/utils';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import type {
  Address,
  Commitment,
  Signature,
  Slot,
  TransactionError,
  UnixTimestamp,
} from '@solana/kit';
import { address as asAddress, signature as asSignature } from '@solana/kit';
import { get, groupBy } from 'lodash';

import type { SolanaKeyringAccount } from '../../../entities/keyring-account';
import { type Network } from '../../constants/solana';
import type { SolanaTransaction } from '../../types/solana';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import type { AssetsService } from '../assets/AssetsService';
import type { AssetMetadata } from '../assets/type';
import type { ConfigProvider } from '../config/ConfigProvider';
import type { SolanaConnection } from '../connection';
import type { TransactionsRepository } from './TransactionsRepository';
import { isSpam } from './utils/isSpam';
import { mapRpcTransaction } from './utils/mapRpcTransaction';

export class TransactionsService {
  readonly #transactionsRepository: TransactionsRepository;

  readonly #assetsService: AssetsService;

  readonly #connection: SolanaConnection;

  readonly #configProvider: ConfigProvider;

  readonly #logger: ILogger;

  constructor(
    transactionsRepository: TransactionsRepository,
    assetsService: AssetsService,
    connection: SolanaConnection,
    configProvider: ConfigProvider,
    logger: ILogger,
  ) {
    this.#transactionsRepository = transactionsRepository;
    this.#assetsService = assetsService;
    this.#connection = connection;
    this.#configProvider = configProvider;
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

  async fetchAccountTransactions(
    account: SolanaKeyringAccount,
  ): Promise<Transaction[]> {
    const { activeNetworks } = this.#configProvider.get();

    const tokenAccounts =
      await this.#assetsService.getTokenAccountsByOwnerMultiple(
        asAddress(account.address),
        [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
        activeNetworks,
      );

    type Asset = {
      network: Network;
      address: string;
      mint: string;
    };

    const tokenAssets: Asset[] = tokenAccounts.map((item) => ({
      network: item.scope,
      address: item.pubkey,
      mint: item.account.data.parsed.info.mint,
    }));

    const nativeAssets: Asset[] = activeNetworks.map((network) => ({
      network,
      address: account.address,
      mint: account.address,
    }));

    const assets: Asset[] = [...tokenAssets, ...nativeAssets];

    const caip19Ids = assets.map((asset) =>
      tokenAddressToCaip19(asset.network, asset.mint),
    );

    const assetsMetadata =
      await this.#assetsService.getAssetsMetadata(caip19Ids);

    const existingTransactions = await this.findByAccounts([account]);
    const existingSignatures = existingTransactions.map((tx) => tx.id);

    const findLatestTransactionForAsset = async (asset: Asset) => {
      const { network, mint } = asset;
      const existingTransaction = existingTransactions
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
        .find(
          (tx) =>
            tx.from.some(
              (from) =>
                tokenAddressToCaip19(network, mint) === get(from, 'asset.type'),
            ) ||
            tx.to.some(
              (to) =>
                tokenAddressToCaip19(network, mint) === get(to, 'asset.type'),
            ),
        );

      if (!existingTransaction) {
        return null;
      }

      return existingTransaction;
    };

    type SignatureWithNetwork = {
      network: Network;
      /** estimated production time of when transaction was processed. null if not available. */
      blockTime: UnixTimestamp | null;
      /** The transaction's cluster confirmation status */
      confirmationStatus: Commitment | null;
      /** Error if transaction failed, null if transaction succeeded. */
      // eslint-disable-next-line id-denylist
      err: TransactionError | null;
      /** Memo associated with the transaction, null if no memo is present */
      memo: string | null;
      /** transaction signature as base-58 encoded string */
      signature: Signature;
      /** The slot that contains the block with the transaction */
      slot: Slot;
    };

    const getSignaturesForAsset = async (
      asset: Asset,
    ): Promise<SignatureWithNetwork[]> => {
      const { network, address } = asset;

      const latestTransaction = await findLatestTransactionForAsset(asset);
      const latestSignature = latestTransaction
        ? asSignature(latestTransaction?.id)
        : undefined;

      const response = await this.#connection
        .getRpc(network)
        .getSignaturesForAddress(asAddress(address), {
          limit: 5,
          ...(latestSignature ? { until: latestSignature } : {}),
        })
        .send();

      return response.map((item) => ({
        ...item,
        network,
      }));
    };

    const signaturesWithNetwork = (
      await Promise.all(assets.map(getSignaturesForAsset))
    ).flat();

    const signaturesToFetch = signaturesWithNetwork
      // Only fetch the transactions that are not already in the state
      .filter((item) => !existingSignatures.includes(item.signature))
      .sort((a, b) => Number(b.slot - a.slot))
      // Take the 20 most recent signatures
      .slice(0, 20);

    type TransactionWithNetwork = {
      transaction: SolanaTransaction | null;
      network: Network;
    };

    const getTransaction = async (
      signatureWithNetwork: SignatureWithNetwork,
    ): Promise<TransactionWithNetwork | null> => {
      try {
        const { signature, network } = signatureWithNetwork;
        const transaction = await this.#connection
          .getRpc(network)
          .getTransaction(asSignature(signature), {
            maxSupportedTransactionVersion: 0,
          })
          .send();
        return {
          transaction,
          network,
        };
      } catch (error) {
        return null;
      }
    };

    const transactions = (
      await Promise.all(signaturesToFetch.map(getTransaction))
    ).filter((item) => item !== null);

    const mapTransaction = async (
      transactionWithNetwork: TransactionWithNetwork,
    ) => {
      const { transaction, network } = transactionWithNetwork;
      if (!transaction) {
        return null;
      }
      return this.#mapRpcTransactionToKeyringTransaction(
        transaction,
        account,
        network,
        assetsMetadata,
      );
    };

    const mappedTransactions = (
      await Promise.all(transactions.map(mapTransaction))
    )
      .filter((item) => item !== null)
      .filter((item) => !isSpam(item, account));

    return mappedTransactions;
  }

  async fetchLatestSignatures(
    scope: Network,
    address: Address,
    limit: number,
  ): Promise<Signature[]> {
    const signatureResponses = await this.#connection
      .getRpc(scope)
      .getSignaturesForAddress(address, {
        limit,
      })
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

  async synchronize(accounts: SolanaKeyringAccount[]): Promise<void> {
    this.#logger.log('Synchronizing transactions for accounts', accounts);

    const transactions = (
      await Promise.all(accounts.map(this.fetchAccountTransactions.bind(this)))
    ).flat();

    await this.saveMany(transactions);
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
