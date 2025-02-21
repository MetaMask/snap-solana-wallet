import type { CaipAssetType } from '@metamask/keyring-api';
import type { Address, Signature } from '@solana/web3.js';

import { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import type { MappedTransaction } from './types';
import { mapRpcTransaction } from './utils/mapRpcTransaction';

export class TransactionsService {
  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  readonly #tokenMetadataService: TokenMetadataService;

  constructor({
    logger,
    connection,
    tokenMetadataService,
  }: {
    logger: ILogger;
    connection: SolanaConnection;
    tokenMetadataService: TokenMetadataService;
  }) {
    this.#connection = connection;
    this.#tokenMetadataService = tokenMetadataService;
    this.#logger = logger;
  }

  async fetchLatestAddressTransactions(address: Address, limit: number) {
    const scopes = [Network.Mainnet, Network.Devnet];

    const transactions = (
      await Promise.all(
        scopes.map(async (scope) =>
          this.fetchAddressTransactions(scope, address, {
            limit,
          }),
        ),
      )
    )
      .flatMap(({ data }) => data)
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

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

    /**
     * Populate token metadata on the `from` and `to` arrays
     * 1. Go through each `from` and `to` element and collect all CAIP 19 IDs for the assets that we need metadata for.
     * 2. Fetch the metadata for this array of CAIP 19 IDs.
     * 3. Map the metadata to the `from` and `to` arrays.
     */
    const caip19Ids = [
      ...new Set(
        mappedTransactionsData.flatMap(({ from, to }) => [
          ...from
            .filter((item) => item.asset?.fungible)
            .map((item) => (item.asset as { type: CaipAssetType }).type),
          ...to
            .filter((item) => item.asset?.fungible)
            .map((item) => (item.asset as { type: CaipAssetType }).type),
        ]),
      ),
    ];
    const tokenMetadata = await this.#tokenMetadataService.getTokensMetadata(
      caip19Ids,
    );
    mappedTransactionsData.forEach((transaction) => {
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
