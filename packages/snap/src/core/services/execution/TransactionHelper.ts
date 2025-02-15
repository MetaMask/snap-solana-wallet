import type {
  CompilableTransactionMessage,
  TransactionMessageBytesBase64,
  TransactionSigner,
} from '@solana/web3.js';
import {
  addSignersToTransactionMessage,
  compileTransaction,
  compileTransactionMessage,
  decompileTransactionMessageFetchingLookupTables,
  getBase64Decoder,
  getBase64Encoder,
  getCompiledTransactionMessageDecoder,
  getCompiledTransactionMessageEncoder,
  getComputeUnitEstimateForTransactionMessageFactory,
  getSignatureFromTransaction,
  getTransactionDecoder,
  getTransactionEncoder,
  pipe,
  sendTransactionWithoutConfirmingFactory,
  signTransactionMessageWithSigners,
  type Blockhash,
} from '@solana/web3.js';

import type { Network } from '../../constants/solana';
import { getSolanaExplorerUrl } from '../../utils/getSolanaExplorerUrl';
import type { ILogger } from '../../utils/logger';
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
 * const transferSolHelper = new TransferSolHelper(transactionHelper, logger);
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
  async getFeeForMessageInLamports(
    budgetedTransactionMessage: CompilableTransactionMessage,
    network: Network,
  ): Promise<string> {
    const base64EncodedMessage = await this.base64EncodeTransactionMessage(
      budgetedTransactionMessage,
    );

    const rpc = this.#connection.getRpc(network);

    const transactionCost = await rpc
      .getFeeForMessage(base64EncodedMessage as TransactionMessageBytesBase64)
      .send();

    this.#logger.log(
      `Transaction is estimated to cost ${transactionCost.value} lamports`,
    );

    return transactionCost.value as any;
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
   * Convert a transaction to a base64 encoded string.
   *
   * Convenient to send a transaction via json serializable channels.
   *
   * @param transactionMessage - The transaction to base64 encode.
   * @returns The base64 encoded transaction.
   */
  async base64EncodeTransaction(
    transactionMessage: CompilableTransactionMessage,
  ): Promise<string> {
    const base64EncodedMessage = pipe(
      transactionMessage,
      // Compile transaction.
      compileTransaction,
      // Encode the transaction into a byte array.
      getTransactionEncoder().encode,
      // Encode that byte array as a base64 string.
      getBase64Decoder().decode,
    );

    return base64EncodedMessage;
  }

  /**
   * Base64 decode a transaction message: converts a base64 encoded string back to a transaction message.
   *
   * @param base64EncodedTransactionMessage - The base64 encoded transaction message to decode.
   * @param scope - The network on which the transaction is being sent.
   * @returns The decoded transaction message.
   */
  async base64DecodeTransaction(
    base64EncodedTransactionMessage: string,
    scope: Network,
  ): Promise<CompilableTransactionMessage> {
    return pipe(
      base64EncodedTransactionMessage,
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
   * Sends a transaction message to the network.
   *
   * The transaction message MUST have:
   * - A valid lifetime constraint.
   *
   * @param transactionMessage - The transaction message to send.
   * @param signers - The signers to use for the transaction.
   * @param network - The network on which to send the transaction.
   * @returns The signature of the transaction.
   */
  async sendTransaction(
    transactionMessage: CompilableTransactionMessage,
    signers: TransactionSigner[],
    network: Network,
  ): Promise<string> {
    try {
      const rpc = this.#connection.getRpc(network);

      const sendTransactionWithoutConfirming =
        sendTransactionWithoutConfirmingFactory({
          rpc,
        });

      const transactionMessageWithSigners = addSignersToTransactionMessage(
        signers,
        transactionMessage,
      );

      const signedTransaction = await signTransactionMessageWithSigners(
        transactionMessageWithSigners,
      );

      const signature = getSignatureFromTransaction(signedTransaction);

      const explorerUrl = getSolanaExplorerUrl(network, 'tx', signature);
      this.#logger.info(`Sending transaction: ${explorerUrl}`);

      await sendTransactionWithoutConfirming(signedTransaction, {
        commitment: 'confirmed',
      });
      return signature;
    } catch (error: any) {
      this.#logger.error(error);
      throw error;
    }
  }
}
