import type { Transaction } from '@metamask/keyring-api';
import type { Address, Signature } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

import {
  LAMPORTS_PER_SOL,
  SOL_SYMBOL,
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../constants/solana';
import type { SolanaTransaction } from '../types/solana';
import type { ILogger } from '../utils/logger';
import type { SolanaConnection } from './connection';

type MappedTransaction = Omit<Transaction, 'account'>;

export class TransactionsService {
  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  constructor({
    logger,
    connection,
  }: {
    logger: ILogger;
    connection: SolanaConnection;
  }) {
    this.#connection = connection;
    this.#logger = logger;
  }

  async fetchInitialAddressTransactions(address: Address) {
    const scopes = [SolanaCaip2Networks.Mainnet, SolanaCaip2Networks.Devnet];

    const transactions = (
      await Promise.all(
        scopes.map(async (scope) =>
          this.fetchAddressTransactions(scope, address, {
            limit: 5,
          }),
        ),
      )
    ).flatMap(({ data }) => data);

    return transactions;
  }

  async fetchAddressTransactions(
    scope: SolanaCaip2Networks,
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
        const mappedTransaction = this.mapRpcTransaction({
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
    scope: SolanaCaip2Networks,
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
    scope: SolanaCaip2Networks;
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

  mapRpcTransaction({
    scope,
    address,
    transactionData,
  }: {
    scope: SolanaCaip2Networks;
    address: Address;
    transactionData: SolanaTransaction | null;
  }): MappedTransaction | null {
    if (!transactionData) {
      return null;
    }

    const firstSignature = transactionData.transaction.signatures[0];

    if (!firstSignature) {
      return null;
    }

    const id = firstSignature as string;
    const timestamp = Number(transactionData.blockTime);

    const fees = this.parseTransactionFees({
      scope,
      transactionData,
    });

    const { from: nativeFrom, to: nativeTo } =
      this.parseTransactionNativeTransfers({
        scope,
        transactionData,
      });

    const from = nativeFrom;
    const to = nativeTo;

    /**
     * If any of the Sol transfers sources include our account's address, we'll consider this a send,
     * since it means that native transfer was the trigger.
     * Otherwise, it's a receive.
     */
    const type = nativeFrom.some(
      ({ address: fromAddress }) => fromAddress === address,
    )
      ? 'send'
      : 'receive';

    return {
      id,
      timestamp,
      chain: scope as `${string}:${string}`,
      status: 'confirmed',
      type,
      from,
      to,
      fees,
      events: [
        {
          status: 'confirmed',
          timestamp,
        },
      ],
    };
  }

  parseTransactionFees({
    scope,
    transactionData,
  }: {
    scope: SolanaCaip2Networks;
    transactionData: SolanaTransaction;
  }): Transaction['fees'] {
    const feeLamports = new BigNumber(
      transactionData.meta?.fee?.toString() ?? '0',
    );
    const feeAmount = feeLamports.dividedBy(LAMPORTS_PER_SOL);

    const fees: any[] = [
      {
        type: 'base',
        asset: {
          fungible: true,
          type: `${scope}/${SolanaCaip19Tokens.SOL}`,
          unit: SOL_SYMBOL,
          amount: feeAmount.toString(),
        },
      },
    ];

    // TODO: How can we parse priority fees here?

    return fees;
  }

  parseTransactionNativeTransfers({
    scope,
    transactionData,
  }: {
    scope: SolanaCaip2Networks;
    transactionData: SolanaTransaction;
  }): { from: Transaction['from']; to: Transaction['to'] } {
    const from: any[] = [];
    const to: any[] = [];

    const preBalances = new Map(
      transactionData.meta?.preBalances.map((balance, index) => [
        index,
        BigInt(balance),
      ]) ?? [],
    );

    const postBalances = new Map(
      transactionData.meta?.postBalances.map((balance, index) => [
        index,
        BigInt(balance),
      ]) ?? [],
    );

    /**
     * Track all accounts that had SOL balance changes
     */
    const allAccountIndexes = new Set([
      ...Array.from(preBalances.keys()),
      ...Array.from(postBalances.keys()),
    ]);

    for (const accountIndex of allAccountIndexes) {
      const preBalance = preBalances.get(accountIndex) ?? BigInt(0);
      const postBalance = postBalances.get(accountIndex) ?? BigInt(0);
      const balanceDiff = postBalance - preBalance;

      /**
       * Skip if no change in balance
       */
      if (balanceDiff === BigInt(0)) {
        continue;
      }

      const accountAddress =
        transactionData.transaction.message.accountKeys[accountIndex];

      const amount = Number(Math.abs(Number(balanceDiff))) / LAMPORTS_PER_SOL;

      if (balanceDiff < BigInt(0)) {
        /**
         * Balance decreased = SOL sent from this account
         */
        from.push({
          address: (accountAddress as string).toString(),
          asset: {
            fungible: true,
            type: `${scope}/${SolanaCaip19Tokens.SOL}`,
            unit: SOL_SYMBOL,
            amount: amount.toString(),
          },
        });
      } else {
        /**
         * Balance increased = SOL received by this account
         */
        to.push({
          address: (accountAddress as string).toString(),
          asset: {
            fungible: true,
            type: `${scope}/${SolanaCaip19Tokens.SOL}`,
            unit: SOL_SYMBOL,
            amount: amount.toString(),
          },
        });
      }
    }

    return { from, to };
  }
}
