import { getSetComputeUnitLimitInstruction } from '@solana-program/compute-budget';
import type { Blockhash } from '@solana/web3.js';
import {
  compileTransactionMessage,
  getBase64Decoder,
  getCompiledTransactionMessageEncoder,
  getComputeUnitEstimateForTransactionMessageFactory,
  pipe,
  prependTransactionMessageInstructions,
} from '@solana/web3.js';

import type { SolanaCaip2Networks } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import { logMaybeSolanaError } from '../../utils/logMaybeSolanaError';
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
 * const transferSolHelper = new TransferSolHelper(transactionHelper, connection, logger);
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
      logMaybeSolanaError(error);
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
      logMaybeSolanaError(error);
      this.#logger.error(error);
      throw error;
    }
  }
}
