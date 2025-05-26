import type { Infer } from '@metamask/superstruct';
import { assert } from '@metamask/superstruct';
import type {
  BaseTransactionMessage,
  CompilableTransactionMessage,
  GetTransactionApi,
  Transaction,
  TransactionMessageBytesBase64,
  TransactionWithLifetime,
} from '@solana/kit';
import {
  addSignersToTransactionMessage,
  signature as asSignature,
  createKeyPairFromPrivateKeyBytes,
  createKeyPairSignerFromPrivateKeyBytes,
  getBase64Codec,
  getComputeUnitEstimateForTransactionMessageFactory,
  isTransactionMessageWithBlockhashLifetime,
  partiallySignTransaction,
  partiallySignTransactionMessageWithSigners,
  pipe,
  type Blockhash,
} from '@solana/kit';

import type { Network } from '../../constants/solana';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import type { DecompileTransactionMessageFetchingLookupTablesConfig } from '../../sdk-extensions/codecs';
import {
  fromBytesToCompilableTransactionMessage,
  fromUnknowBase64StringToTransactionOrTransactionMessage,
} from '../../sdk-extensions/codecs';
import {
  estimateAndOverrideComputeUnitLimit,
  isTransactionMessageWithComputeUnitLimitInstruction,
  isTransactionMessageWithComputeUnitPriceInstruction,
  setComputeUnitPriceInstructionIfMissing,
  setTransactionMessageFeePayerIfMissing,
  setTransactionMessageLifetimeUsingBlockhashIfMissing,
} from '../../sdk-extensions/transaction-messages';
import { deriveSolanaKeypair } from '../../utils/deriveSolanaKeypair';
import type { ILogger } from '../../utils/logger';
import { retry } from '../../utils/retry';
import { Base58Struct, Base64Struct } from '../../validation/structs';
import type { SolanaConnection } from '../connection';

/**
 * Helper class for transaction related operations.
 *
 * Only define here methods that are not specific to any particular transaction type.
 * If you need to define a method that is specific to a particular transaction type,
 * create a new helper class for that transaction type, and inject this transaction helper into it.
 */
export class TransactionHelper {
  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  static readonly defaultComputeUnitPriceInMicroLamportsPerComputeUnit = 10000n;

  constructor(connection: SolanaConnection, logger: ILogger) {
    this.#connection = connection;
    this.#logger = logger;
  }

  /**
   * Every transaction needs to specify a valid lifetime for it to be accepted for execution on the
   * network. This utility method fetches the latest block's hash as proof that the
   * transaction was prepared close in time to when we tried to execute it. The network will accept
   * transactions which include this hash until it progresses past the block specified as
   * `latestBlockhash.lastValidBlockHeight`.
   *
   * TIP: It is desirable for the program to fetch this block hash as late as possible before signing
   * and sending the transaction so as to ensure that it's as 'fresh' as possible.
   *
   * @param network - The network on which to get the latest blockhash.
   * @returns The latest blockhash and the last valid block height.
   */
  async getLatestBlockhash(network: Network): Promise<
    Readonly<{
      blockhash: Blockhash;
      lastValidBlockHeight: bigint;
    }>
  > {
    try {
      const latestBlockhashResponse = await this.#connection
        .getRpc(network)
        .getLatestBlockhash()
        .send();

      return latestBlockhashResponse.value;
    } catch (error: any) {
      this.#logger.error(error);
      throw error;
    }
  }

  /**
   * Get the compute unit estimate for a transaction message, so that we can right-size the compute budget to maximize the chance that it will be selected for inclusion into a block.
   *
   * @param transactionMessage - The transaction message to get the compute unit estimate for.
   * @param network - The network on which the transaction is being sent.
   * @see https://solana.com/developers/cookbook/transactions/calculate-cost
   * @returns The compute unit estimate.
   */
  async getComputeUnitEstimate(
    transactionMessage: Parameters<
      ReturnType<typeof getComputeUnitEstimateForTransactionMessageFactory>
    >[0],
    network: Network,
  ): Promise<number> {
    const rpc = this.#connection.getRpc(network);
    const getComputeUnitEstimate =
      getComputeUnitEstimateForTransactionMessageFactory({
        rpc,
      });

    return await getComputeUnitEstimate(transactionMessage);
  }

  /**
   * Gets the fee for a transaction message in lamports.
   *
   * @param base64String - The base64 encoded transaction message to get the fee for.
   * @param network - The network on which the transaction is being sent.
   * @see https://solana.com/developers/cookbook/transactions/calculate-cost
   * @returns The fee for the transaction in lamports.
   */
  async getFeeFromBase64StringInLamports(
    base64String: Infer<typeof Base64Struct>,
    network: Network,
  ): Promise<string | null> {
    try {
      assert(base64String, Base64Struct);

      const transactionOrTransactionMessage =
        await fromUnknowBase64StringToTransactionOrTransactionMessage(
          base64String,
          this.#connection.getRpc(network),
        );

      /**
       * If it's a transaction message, we can return the base64 string directly.
       * Otherwise, it's a transaction, so we need to recover the message bytes from the transaction and then convert bytes to a base64 string.
       */
      const base64EncodedTransactionMessage =
        'instructions' in transactionOrTransactionMessage
          ? base64String
          : getBase64Codec().decode(
              transactionOrTransactionMessage.messageBytes,
            );

      const rpc = this.#connection.getRpc(network);

      const transactionCost = await rpc
        .getFeeForMessage(
          base64EncodedTransactionMessage as TransactionMessageBytesBase64,
          { commitment: 'confirmed' },
        )
        .send();

      this.#logger.log(
        `Transaction is estimated to cost ${transactionCost.value} lamports`,
      );

      return transactionCost.value as any;
    } catch (error: any) {
      this.#logger.error(error);
      return null;
    }
  }

  /**
   * Waits for a transaction to reach a given commitment level by polling the RPC.
   *
   * @param signature - The signature of the transaction to wait for.
   * @param commitmentLevel - The commitment level to wait for.
   * @param network - The network on which the transaction is being sent.
   * @returns The transaction.
   */
  async waitForTransactionCommitment(
    signature: Infer<typeof Base58Struct>,
    commitmentLevel: 'confirmed' | 'finalized',
    network: Network,
  ): Promise<ReturnType<GetTransactionApi['getTransaction']>> {
    assert(signature, Base58Struct);

    const rpc = this.#connection.getRpc(network);

    return retry(
      async () => {
        this.#logger.log(
          `🔎 Checking if transaction ${signature} has reached commitment level ${commitmentLevel}`,
        );
        const transaction = await rpc
          .getTransaction(asSignature(signature), {
            commitment: commitmentLevel,
            maxSupportedTransactionVersion: 0,
          })
          .send();

        if (transaction) {
          this.#logger.log(
            `🎉 Transaction ${signature} has reached commitment level ${commitmentLevel}`,
          );
          return transaction;
        }

        const errorMessage = `⚠️ Transaction with signature ${signature} not found or has not yet reached requested commitment level: ${commitmentLevel}`;
        this.#logger.warn(errorMessage);
        throw new Error(errorMessage);
      },
      {
        delayMs: 200,
      },
    );
  }

  /**
   * Partially signs an arbitrary base64 string, adapting the logic depending on whether
   * the string represents a transaction or a transaction message.
   *
   * - If it's a transaction message, we need to need add all missing fields, then sign it.
   * - If it's a transaction, we need to need add the account's signature.
   *
   * @param base64String - The base64 encoded transaction or transaction message to sign.
   * @param account - The account to sign the transaction or transaction message with.
   * @param network - The network on which the transaction is being sent.
   * @param config - The configuration for the request.
   * @returns The signed transaction.
   * @throws If the base64 string is not a valid transaction or transaction message.
   */
  async partiallySignBase64String(
    base64String: Infer<typeof Base64Struct>,
    account: SolanaKeyringAccount,
    network: Network,
    config?: DecompileTransactionMessageFetchingLookupTablesConfig,
  ): Promise<Transaction> {
    const rpc = this.#connection.getRpc(network);

    // The received base64 string can either represent a transaction or a transaction message.
    const transactionMessageOrTransaction =
      await fromUnknowBase64StringToTransactionOrTransactionMessage(
        base64String,
        rpc,
        config,
      );

    // It's a transaction message, add all missing fields, then partially sign it.
    if ('instructions' in transactionMessageOrTransaction) {
      return this.#prepareAndPartiallySignTransactionMessage(
        transactionMessageOrTransaction,
        account,
        network,
      );
    }

    const isUnsigned = Object.values(
      transactionMessageOrTransaction.signatures,
    ).every((signature) => !signature);

    // It's an unsigned transaction, grab the message from the transaction and apply the same logic as above.
    if (isUnsigned) {
      const { messageBytes } = transactionMessageOrTransaction;

      const transactionMessageFromUnsignedTransaction =
        await fromBytesToCompilableTransactionMessage(
          messageBytes,
          rpc,
          config,
        );

      return this.#prepareAndPartiallySignTransactionMessage(
        transactionMessageFromUnsignedTransaction,
        account,
        network,
      );
    }

    // It's a partially signed transaction, so we cannot alter its content, and we add the account's signature.
    return this.#partiallySignTransaction(
      transactionMessageOrTransaction,
      account,
    );
  }

  /**
   * Prepares the passed transaction message by:
   * - adding a feePayer if missing,
   * - adding a lifetimeConstraint if missing,
   * - adding a computeUnitLimit if missing,
   * - adding a computeUnitPrice if missing,
   * - partially signing it with the passed account.
   *
   * @param transactionMessage - The transaction message to sign.
   * @param account - The account to sign the transaction message with.
   * @param scope - The network where the transaction is to be sent.
   * @returns The partially signed transaction.
   */
  async #prepareAndPartiallySignTransactionMessage(
    transactionMessage: BaseTransactionMessage,
    account: SolanaKeyringAccount,
    scope: Network,
  ): Promise<Readonly<Transaction & TransactionWithLifetime>> {
    const { privateKeyBytes } = await deriveSolanaKeypair({
      entropySource: account.entropySource,
      derivationPath: account.derivationPath,
    });
    const signer = await createKeyPairSignerFromPrivateKeyBytes(
      privateKeyBytes,
    );

    // First, make sure the transaction message has a fee payer, lifetime constraint and compute unit price
    const hasLifetimeConstraint =
      isTransactionMessageWithBlockhashLifetime(transactionMessage);

    const blockhash = hasLifetimeConstraint
      ? transactionMessage.lifetimeConstraint // Use any value, it won't be used
      : await this.getLatestBlockhash(scope);

    const hasComputeUnitPrice =
      isTransactionMessageWithComputeUnitPriceInstruction(transactionMessage);

    const microLamports =
      TransactionHelper.defaultComputeUnitPriceInMicroLamportsPerComputeUnit;

    const hasComputeUnitLimit =
      isTransactionMessageWithComputeUnitLimitInstruction(transactionMessage);

    /**
     * We add a compute unit limit if it's missing, but also if we the compute unit price is missing.
     * Why? Because we will add an extra instruction for the compute unit price, which incidentally increases
     * the compute unit consumed by the transaction. So we need to re-estimate the compute unit limit and override it.
     */
    const shouldSetComputeUnitLimit =
      !hasComputeUnitLimit || !hasComputeUnitPrice;

    const compilableTransactionMessage = await pipe(
      transactionMessage,
      (tx) => setTransactionMessageFeePayerIfMissing(signer.address, tx),
      (tx) =>
        setTransactionMessageLifetimeUsingBlockhashIfMissing(blockhash, tx),
      (tx) =>
        setComputeUnitPriceInstructionIfMissing(tx, {
          microLamports,
        }),
      // If the transaction message had no compute unit price, we just added one, so we need to recompute the compute unit limit
      async (tx) =>
        shouldSetComputeUnitLimit
          ? estimateAndOverrideComputeUnitLimit(
              tx,
              this.#connection.getRpc(scope),
            )
          : tx,
    );

    // Attach the signers to the transaction message
    const transactionMessageWithSigners = addSignersToTransactionMessage(
      [signer],
      compilableTransactionMessage,
    );

    /**
     * Partially sign the transaction message with the signers.
     *
     * When we "partially" sign, we only sign with the passed signers, and don't expect the
     * transaction to be fully signed afterwards.
     *
     * It's important to do this because the transaction might also expect signatures from other signers,
     * so we need to return it as is, so that more signers can sign later.
     */
    const signedTransaction = await partiallySignTransactionMessageWithSigners(
      transactionMessageWithSigners,
    );

    return signedTransaction;
  }

  /**
   * Partially signs a transaction with the passed account.
   *
   * @param transaction - The transaction to partially sign.
   * @param account - The account to partially sign the transaction with.
   * @returns The partially signed transaction.
   */
  async #partiallySignTransaction(
    transaction: Transaction,
    account: SolanaKeyringAccount,
  ) {
    const { privateKeyBytes } = await deriveSolanaKeypair({
      entropySource: account.entropySource,
      derivationPath: account.derivationPath,
    });

    const keyPair = await createKeyPairFromPrivateKeyBytes(privateKeyBytes);

    return partiallySignTransaction([keyPair], transaction);
  }

  /**
   * Extracts the instructions from a base64 string, adapting the logic depending on whether
   * the string represents a transaction or a transaction message.
   *
   * @param base64EncodedString - The base64 encoded string to extract the instructions from.
   * @param scope - The network on which the transaction is being sent.
   * @returns The instructions from the base64 encoded string.
   * @throws If the base64 encoded string is not a valid transaction or transaction message.
   */
  async extractInstructionsFromUnknownBase64String(
    base64EncodedString: Infer<typeof Base64Struct>,
    scope: Network,
  ): Promise<CompilableTransactionMessage['instructions']> {
    const rpc = this.#connection.getRpc(scope);

    const transactionOrTransactionMessage =
      await fromUnknowBase64StringToTransactionOrTransactionMessage(
        base64EncodedString,
        rpc,
      );

    if ('instructions' in transactionOrTransactionMessage) {
      return transactionOrTransactionMessage.instructions;
    }

    const transactionMessage = await fromBytesToCompilableTransactionMessage(
      transactionOrTransactionMessage.messageBytes,
      rpc,
    );

    return transactionMessage.instructions;
  }
}
