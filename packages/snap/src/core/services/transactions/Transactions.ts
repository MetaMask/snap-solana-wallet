import type { Address, Signature } from '@solana/web3.js';

import { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { ConfigProvider } from '../config';
import type { SolanaConnection } from '../connection';
import type { MappedTransaction } from './types';
import { mapRpcTransaction } from './utils/mapRpcTransaction';

export class TransactionsService {
  readonly #configProvider: ConfigProvider;

  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  constructor({
    logger,
    connection,
    configProvider,
  }: {
    logger: ILogger;
    configProvider: ConfigProvider;
    connection: SolanaConnection;
  }) {
    this.#configProvider = configProvider;
    this.#connection = connection;
    this.#logger = logger;
  }

  async fetchInitialAddressTransactions(address: Address) {
    const scopes = [Network.Mainnet, Network.Devnet];

    const transactions = (
      await Promise.all(
        scopes.map(async (scope) =>
          this.fetchAddressTransactions(scope, address, {
            limit: this.#configProvider.get().transactions.bootstrapLimit,
          }),
        ),
      )
    ).flatMap(({ data }) => data);

    return transactions;
  }

  async fetchAddressTransactions(
    scope: Network,
    address: Address,
    pagination: { limit: number; next?: Signature | null },
  ): Promise<{
    data: MappedTransaction[];
    next: Signature | null;
  }> {
    /**
     * First get signatures
     */
    const signatures = (
      await this.#connection
        .getRpc(scope)
        .getSignaturesForAddress(
          address,
          pagination.next
            ? {
                limit: pagination.limit,
                before: pagination.next,
              }
            : { limit: pagination.limit },
        )
        .send()
    ).map(({ signature }) => signature);

    /**
     * Now fetch their transaction data
     */
    const transactionsData = await this.getTransactionsDataFromSignatures({
      scope,
      signatures,
    });

    /**
     * Map it to the expected format from the Keyring API
     */
    const mappedTransactionsData = transactionsData.reduce<MappedTransaction[]>(
      (transactions, transactionData) => {
        const mappedTransaction = mapRpcTransaction({
          scope,
          address,
          transactionData,
        });

        /**
         * Filter out unmapped transactions
         */
        if (mappedTransaction) {
          transactions.push(mappedTransaction);
        }

        return transactions;
      },
      [],
    );

    const next =
      signatures.length === pagination.limit
        ? signatures[signatures.length - 1] ?? null
        : null;

    return {
      data: mappedTransactionsData,
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
}
