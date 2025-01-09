import type { Transaction } from '@metamask/keyring-api';
import type { Address, Signature } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

import {
  LAMPORTS_PER_SOL,
  Network,
  Networks,
  TokenMetadata,
} from '../../constants/solana';
import type { SolanaTransaction } from '../../types/solana';
import type { ILogger } from '../../utils/logger';
import type { SolanaConnection } from '../connection';

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
    const scopes = [Network.Mainnet, Network.Devnet];

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

  mapRpcTransaction({
    scope,
    address,
    transactionData,
  }: {
    scope: Network;
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

    const {
      fees,
      from: nativeFrom,
      to: nativeTo,
    } = this.parseTransactionNativeTransfers({
      scope,
      transactionData,
    });

    const { from: splFrom, to: splTo } = this.parseTransactionSplTransfers({
      scope,
      transactionData,
    });

    const from = [...nativeFrom, ...splFrom];
    const to = [...nativeTo, ...splTo];

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
    scope: Network;
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
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
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
    scope: Network;
    transactionData: SolanaTransaction;
  }): {
    fees: Transaction['fees'];
    from: Transaction['from'];
    to: Transaction['to'];
  } {
    const fees = this.parseTransactionFees({
      scope,
      transactionData,
    });

    const from: any[] = [];
    const to: any[] = [];

    // Get the fee payer (first account in accountKeys)
    const feePayer = transactionData.transaction.message.accountKeys[0];
    const feeAmount = BigInt(transactionData.meta?.fee ?? 0);

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
      let balanceDiff = postBalance - preBalance;

      const accountAddress =
        transactionData.transaction.message.accountKeys[accountIndex];

      // Adjust balance difference for fee payer to exclude the transaction fee
      if (accountAddress === feePayer) {
        balanceDiff += feeAmount;
      }

      if (balanceDiff === BigInt(0)) {
        continue;
      }

      const amount = Number(Math.abs(Number(balanceDiff))) / LAMPORTS_PER_SOL;

      if (balanceDiff < BigInt(0)) {
        from.push({
          address: (accountAddress as string).toString(),
          asset: {
            fungible: true,
            type: Networks[scope].nativeToken.caip19Id,
            unit: Networks[scope].nativeToken.symbol,
            amount: amount.toString(),
          },
        });
      }

      if (balanceDiff > BigInt(0)) {
        to.push({
          address: (accountAddress as string).toString(),
          asset: {
            fungible: true,
            type: Networks[scope].nativeToken.caip19Id,
            unit: Networks[scope].nativeToken.symbol,
            amount: amount.toString(),
          },
        });
      }
    }

    return { fees, from, to };
  }

  parseTransactionSplTransfers({
    scope,
    transactionData,
  }: {
    scope: Network;
    transactionData: SolanaTransaction;
  }): {
    from: Transaction['from'];
    to: Transaction['to'];
  } {
    const from: any[] = [];
    const to: any[] = [];

    const preBalances = new Map(
      transactionData.meta?.preTokenBalances?.map((balance) => [
        balance.accountIndex,
        BigInt(balance.uiTokenAmount.amount),
      ]) ?? [],
    );

    const postBalances = new Map(
      transactionData.meta?.postTokenBalances?.map((balance) => [
        balance.accountIndex,
        BigInt(balance.uiTokenAmount.amount),
      ]) ?? [],
    );

    // Track all accounts that had token balance changes
    const allAccountIndexes = new Set([
      ...(transactionData.meta?.preTokenBalances?.map((b) => b.accountIndex) ??
        []),
      ...(transactionData.meta?.postTokenBalances?.map((b) => b.accountIndex) ??
        []),
    ]);

    for (const accountIndex of allAccountIndexes) {
      const preBalance = preBalances.get(accountIndex) ?? BigInt(0);
      const postBalance = postBalances.get(accountIndex) ?? BigInt(0);
      const balanceDiff = postBalance - preBalance;

      if (balanceDiff === BigInt(0)) {
        continue;
      }

      const tokenDetails =
        transactionData.meta?.preTokenBalances?.find(
          (b) => b.accountIndex === accountIndex,
        ) ??
        transactionData.meta?.postTokenBalances?.find(
          (b) => b.accountIndex === accountIndex,
        );

      if (!tokenDetails) {
        continue;
      }

      const {
        mint,
        uiTokenAmount: { decimals },
        owner,
      } = tokenDetails;

      const caip19Id = `${scope}/token:${mint}`;
      const tokenInformation =
        TokenMetadata[caip19Id as keyof typeof TokenMetadata];

      if (!owner || !tokenInformation) {
        continue;
      }

      const unit = tokenInformation.symbol;

      const amount =
        Number(Math.abs(Number(balanceDiff))) / Math.pow(10, decimals);

      if (balanceDiff < BigInt(0)) {
        from.push({
          address: owner,
          asset: {
            fungible: true,
            type: caip19Id,
            unit,
            amount: amount.toString(),
          },
        });
      }

      if (balanceDiff > BigInt(0)) {
        to.push({
          address: owner,
          asset: {
            fungible: true,
            type: caip19Id,
            unit,
            amount: amount.toString(),
          },
        });
      }
    }

    return { from, to };
  }
}
