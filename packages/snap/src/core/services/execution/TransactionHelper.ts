import type { Infer } from '@metamask/superstruct';
import { assert } from '@metamask/superstruct';
import type {
  Commitment,
  CompilableTransactionMessage,
  FullySignedTransaction,
  GetTransactionApi,
  Lamports,
  TransactionMessageBytesBase64,
  TransactionWithLifetime,
} from '@solana/kit';
import {
  addSignersToTransactionMessage,
  signature as asSignature,
  compileTransactionMessage,
  createKeyPairSignerFromPrivateKeyBytes,
  decompileTransactionMessage,
  decompileTransactionMessageFetchingLookupTables,
  getBase64Codec,
  getBase64Decoder,
  getBase64Encoder,
  getCompiledTransactionMessageDecoder,
  getCompiledTransactionMessageEncoder,
  getComputeUnitEstimateForTransactionMessageFactory,
  getTransactionCodec,
  getTransactionDecoder,
  pipe,
  signTransactionMessageWithSigners,
  type Blockhash,
} from '@solana/kit';

import type { Network } from '../../constants/solana';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import { deriveSolanaPrivateKey } from '../../utils/deriveSolanaPrivateKey';
import type { ILogger } from '../../utils/logger';
import { PromiseAny } from '../../utils/PromiseAny';
import { retry } from '../../utils/retry';
import { Base58Struct, Base64Struct } from '../../validation/structs';
import type { SolanaConnection } from '../connection';

/**
 * Helper class for transaction related operations.
 *
 * Only define here methods that are not specific to any particular transaction type.
 * If you need to define a method that is specific to a particular transaction type,
 * create a new helper class for that transaction type, and inject this transaction helper into it.
 *
 * @example
 * const transactionHelper = new TransactionHelper(connection, logger);
 * const sendSolBuilder = new SendSolBuilder(transactionHelper, logger);
 */
export class TransactionHelper {
  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

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
   * Gets the fee for a transaction message in lamports. Assumes that the transaction message has been
   * "budgeted" for compute units.
   *
   * @param budgetedTransactionMessage - The transaction message to get the fee for.
   * @param network - The network on which the transaction is being sent.
   * @see https://solana.com/developers/cookbook/transactions/calculate-cost
   * @returns The fee for the transaction in lamports.
   */
  async getFeeFromTransactionInLamports(
    budgetedTransactionMessage: CompilableTransactionMessage,
    network: Network,
  ): Promise<string | null> {
    const base64EncodedMessage = await this.base64EncodeTransactionMessage(
      budgetedTransactionMessage,
    );

    return await this.getFeeForMessageInLamports(base64EncodedMessage, network);
  }

  /**
   * Gets the fee for a transaction message in lamports.
   *
   * @param base64EncodedMessage - The base64 encoded transaction message to get the fee for.
   * @param network - The network on which the transaction is being sent.
   * @see https://solana.com/developers/cookbook/transactions/calculate-cost
   * @returns The fee for the transaction in lamports.
   */
  async getFeeForMessageInLamports(
    base64EncodedMessage: Infer<typeof Base64Struct>,
    network: Network,
  ): Promise<string | null> {
    try {
      assert(base64EncodedMessage, Base64Struct);

      const rpc = this.#connection.getRpc(network);

      const transactionCost = await rpc
        .getFeeForMessage(
          base64EncodedMessage as TransactionMessageBytesBase64,
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
   * Convert a transaction message to a base64 encoded string.
   *
   * Convenient to send a transaction message via json serializable channels.
   *
   * WARNING: It strips off the private keys from the transaction message, so you need to add them back in when you decode the transaction message in order to sign it.
   *
   * @example
   * const transactionMessage = await transactionHelper.base64DecodeTransactionMessage(base64EncodedTransactionMessage);
   * // send it over RPC or other JSON serializable channels
   * // receive it on the other side
   * const transactionMessageWithSigners = addSignersToTransactionMessage(signers, transactionMessage);
   * const signature = await transactionHelper.sendTransaction(transactionMessageWithSigners, signers, network);
   * @param transactionMessage - The transaction message to base64 encode.
   * @returns The base64 encoded transaction message.
   */
  async base64EncodeTransactionMessage(
    transactionMessage: CompilableTransactionMessage,
  ): Promise<string> {
    const base64EncodedMessage = pipe(
      transactionMessage,
      // Compile it.
      compileTransactionMessage,
      // Convert the compiled message into a byte array.
      getCompiledTransactionMessageEncoder().encode,
      // Encode that byte array as a base64 string.
      getBase64Decoder().decode,
    );

    return base64EncodedMessage;
  }

  /**
   * Decodes a base64 encoded transaction message into a transaction message.
   *
   * @param base64EncodedTransactionMessage - The base64 encoded transaction message to decode.
   * @returns The decoded transaction message.
   */
  async #decodeBase64EncodedTransactionMessage(
    base64EncodedTransactionMessage: Infer<typeof Base64Struct>,
  ): Promise<CompilableTransactionMessage> {
    return pipe(
      base64EncodedTransactionMessage,
      getBase64Encoder().encode,
      getCompiledTransactionMessageDecoder().decode,
      decompileTransactionMessage,
    );
  }

  /**
   * Decodes a base64 encoded transaction into a transaction message.
   *
   * @param base64EncodedTransaction - The base64 encoded transaction to decode.
   * @param scope - The network on which the transaction is being sent.
   * @returns The decoded transaction message.
   */
  async #decodeBase64EncodedTransaction(
    base64EncodedTransaction: Infer<typeof Base64Struct>,
    scope: Network,
  ): Promise<CompilableTransactionMessage> {
    return pipe(
      base64EncodedTransaction,
      getBase64Encoder().encode,
      getTransactionDecoder().decode,
      (tx) => getCompiledTransactionMessageDecoder().decode(tx.messageBytes),
      async (decodedMessageBytes) =>
        decompileTransactionMessageFetchingLookupTables(
          decodedMessageBytes,
          this.#connection.getRpc(scope),
        ),
    );
  }

  /**
   * Decodes a base64 encoded string (either a transaction message or a transaction) into a transaction message.
   *
   * @param base64EncodedString - The base64 encoded string to decode.
   * @param scope - The network on which the transaction is being sent.
   * @returns The decoded transaction message.
   */
  async decodeBase64Encoded(
    base64EncodedString: Infer<typeof Base64Struct>,
    scope: Network,
  ): Promise<CompilableTransactionMessage> {
    return PromiseAny([
      this.#decodeBase64EncodedTransactionMessage(base64EncodedString),
      this.#decodeBase64EncodedTransaction(base64EncodedString, scope),
    ]);
  }

  /**
   * Base64 encode a transaction message from a base64 encoded transaction.
   *
   * @param base64EncodedTransaction - The base64 encoded transaction to encode.
   * @returns The base64 encoded transaction message.
   */
  async base64EncodeTransactionMessageFromBase64EncodedTransaction(
    base64EncodedTransaction: Infer<typeof Base64Struct>,
  ): Promise<string> {
    return pipe(
      base64EncodedTransaction,
      getBase64Encoder().encode,
      getTransactionDecoder().decode,
      (tx) => tx.messageBytes,
      getBase64Decoder().decode,
    );
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
   * Returns minimum balance required to make account rent exempt.
   * @param network - The network on which the transaction is being sent.
   * @param accountSize - The Account's data length.
   * @param config - The configuration for the request.
   * @param config.commitment - The commitment level to use.
   * @returns The minimum balance in lamports required to make account rent exempt.
   */
  async getMinimumBalanceForRentExemption(
    network: Network,
    accountSize = BigInt(0),
    config?: {
      commitment?: Commitment;
    },
  ): Promise<Lamports> {
    const rpc = this.#connection.getRpc(network);
    const minimumBalance = await rpc
      .getMinimumBalanceForRentExemption(accountSize, config)
      .send();
    return minimumBalance;
  }

  /**
   * Signs a transaction message.
   *
   * @param transactionMessage - The transaction message to sign.
   * @param account - The account to sign the transaction message with.
   * @returns The signed transaction.
   */
  async signTransactionMessage(
    transactionMessage: CompilableTransactionMessage,
    account: SolanaKeyringAccount,
  ): Promise<Readonly<FullySignedTransaction & TransactionWithLifetime>> {
    const { privateKeyBytes } = await deriveSolanaPrivateKey(account.index);
    const signer = await createKeyPairSignerFromPrivateKeyBytes(
      privateKeyBytes,
    );

    const transactionMessageWithSigners = addSignersToTransactionMessage(
      [signer],
      transactionMessage,
    );

    const signedTransaction = await signTransactionMessageWithSigners(
      transactionMessageWithSigners,
    );

    return signedTransaction;
  }

  /**
   * Encodes a signed transaction to a base64 encoded string.
   *
   * @param signedTransaction - The signed transaction to encode.
   * @returns The base64 encoded signed transaction.
   */
  async encodeSignedTransactionToBase64(
    signedTransaction: Readonly<
      FullySignedTransaction & TransactionWithLifetime
    >,
  ): Promise<string> {
    const signedTransactionBytes =
      getTransactionCodec().encode(signedTransaction);

    const signedTransactionBase64 = getBase64Codec().decode(
      signedTransactionBytes,
    );

    return signedTransactionBase64;
  }
}
