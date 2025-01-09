import { getSetComputeUnitLimitInstruction } from '@solana-program/compute-budget';
import {
  compileTransactionMessage,
  getBase64Decoder,
  getCompiledTransactionMessageEncoder,
  getComputeUnitEstimateForTransactionMessageFactory,
  getSignatureFromTransaction,
  pipe,
  prependTransactionMessageInstructions,
  sendTransactionWithoutConfirmingFactory,
  signTransactionMessageWithSigners,
  type Blockhash,
  type IInstruction,
  type ITransactionMessageWithFeePayer,
  type TransactionMessageWithBlockhashLifetime,
} from '@solana/web3.js';

import type { SolanaCaip2Networks } from '../../constants/solana';
import { getSolanaExplorerUrl } from '../../utils/get-solana-explorer-url';
import type { ILogger } from '../../utils/logger';
import type { SolanaConnection } from '../connection';

type TransactionMessage = TransactionMessageWithBlockhashLifetime &
  ITransactionMessageWithFeePayer &
  Omit<
    Readonly<{
      instructions: readonly IInstruction[];
      version: 0;
    }>,
    'feePayer'
  >;

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
  async getLatestBlockhash(network: SolanaCaip2Networks): Promise<
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
   * Calculate the cost of the passed transaction message in lamports.
   *
   * @param transactionMessage - The transaction message to calculate the cost for.
   * @param network - The network on which the transaction is being sent.
   * @see https://solana.com/developers/cookbook/transactions/calculate-cost
   * @returns The cost of the transaction in lamports.
   */
  async calculateCostInLamports(
    transactionMessage: Parameters<
      ReturnType<typeof getComputeUnitEstimateForTransactionMessageFactory>
    >[0],
    network: SolanaCaip2Networks,
  ): Promise<string> {
    try {
      const rpc = this.#connection.getRpc(network);

      // Create a utility that estimates a transaction message's compute consumption.
      const getComputeUnitEstimate =
        getComputeUnitEstimateForTransactionMessageFactory({
          rpc,
        });

      // Figure out how many compute units to budget for this transaction
      // so that you can right-size the compute budget to maximize the
      // chance that it will be selected for inclusion into a block.
      this.#logger.log('Estimating the compute consumption of the transaction');
      const estimatedComputeUnits = await getComputeUnitEstimate(
        transactionMessage,
      );
      this.#logger.log(
        `Transaction is estimated to consume ${estimatedComputeUnits} compute units`,
      );

      const budgetedTransactionMessage = prependTransactionMessageInstructions(
        [getSetComputeUnitLimitInstruction({ units: estimatedComputeUnits })],
        transactionMessage,
      );

      const base64EncodedMessage = pipe(
        // Start with the message you want the fee for.
        budgetedTransactionMessage as any,

        // Compile it.
        compileTransactionMessage,

        // Convert the compiled message into a byte array.
        getCompiledTransactionMessageEncoder().encode,

        // Encode that byte array as a base64 string.
        getBase64Decoder().decode,
      );

      const transactionCost = await rpc
        .getFeeForMessage(base64EncodedMessage as any)
        .send();

      this.#logger.log(
        `Transaction is estimated to cost ${transactionCost.value} lamports`,
      );

      return transactionCost.value as any;
    } catch (error: any) {
      this.#logger.error(error);
      throw error;
    }
  }

  /**
   * Send a transaction message to the network.
   *
   * @param transactionMessage - The transaction message to send.
   * @param network - The network on which to send the transaction.
   * @returns The signature of the transaction.
   */
  async sendTransaction(
    transactionMessage: TransactionMessage,
    network: SolanaCaip2Networks,
  ): Promise<string> {
    try {
      const rpc = this.#connection.getRpc(network);

      const sendTransactionWithoutConfirming =
        sendTransactionWithoutConfirmingFactory({
          rpc,
        });

      const signedTransaction = await signTransactionMessageWithSigners(
        transactionMessage,
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
