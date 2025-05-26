import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import { getTransferSolInstruction } from '@solana-program/system';
import type { CompilableTransactionMessage } from '@solana/kit';
import {
  address,
  appendTransactionMessageInstruction,
  createNoopSigner,
  createTransactionMessage,
  pipe,
  prependTransactionMessageInstructions,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';

import type { SolanaConnection } from '../../../core/services/connection';
import { solToLamports } from '../../../core/utils/conversion';
import type { ILogger } from '../../../core/utils/logger';
import type {
  BuildSendTransactionParams,
  ISendTransactionBuilder,
} from './ISendTransactionBuilder';

/**
 * Helper class for transferring SOL.
 */
export class SendSolBuilder implements ISendTransactionBuilder {
  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  // The send SOL transaction has a predictable compute unit consumption of 450.
  readonly #computeUnitLimit = 450;

  readonly #computeUnitPriceMicroLamportsPerComputeUnit = 10000n;

  constructor(connection: SolanaConnection, logger: ILogger) {
    this.#connection = connection;
    this.#logger = logger;
  }

  /**
   * Build the transaction message for transferring SOL.
   *
   * @param params - The parameters for building the transaction message.
   * @returns The transaction message.
   */
  async buildTransactionMessage(
    params: BuildSendTransactionParams,
  ): Promise<CompilableTransactionMessage> {
    try {
      const { from, to, amount, network } = params;
      const fromAddress = address(from.address);

      const amountInLamports = BigInt(solToLamports(amount).toString());

      const latestBlockhash = (
        await this.#connection.getRpc(network).getLatestBlockhash().send()
      ).value;

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        // Every transaction must state from which account the transaction fee should be debited from,
        // and that account must sign the transaction. Here, we'll make the source account pay the fee.
        (tx) => setTransactionMessageFeePayer(fromAddress, tx),
        // A transaction is valid for execution as long as it includes a valid lifetime constraint. Here
        // we supply the hash of a recent block. The network will accept this transaction until it
        // considers that hash to be 'expired' for the purpose of transaction execution.
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        // Every transaction needs at least one instruction. This instruction describes the transfer.
        (tx) =>
          appendTransactionMessageInstruction(
            /**
             * The system program has the exclusive right to transfer Lamports from one account to
             * another. Here we use an instruction creator from the `@solana-program/system` package
             * to create a transfer instruction for the system program.
             */
            getTransferSolInstruction({
              amount: amountInLamports,
              destination: to,
              source: createNoopSigner(fromAddress),
            }),
            tx,
          ),
      );

      const budgetedTransactionMessage = prependTransactionMessageInstructions(
        [
          getSetComputeUnitLimitInstruction({ units: this.#computeUnitLimit }),
          getSetComputeUnitPriceInstruction({
            microLamports: this.#computeUnitPriceMicroLamportsPerComputeUnit,
          }),
        ],
        transactionMessage,
      );

      return budgetedTransactionMessage;
    } catch (error) {
      this.#logger.error({ error }, 'Error building transaction message');
      throw error;
    }
  }

  getComputeUnitLimit(): number {
    return this.#computeUnitLimit;
  }

  getComputeUnitPriceMicroLamportsPerComputeUnit(): bigint {
    return this.#computeUnitPriceMicroLamportsPerComputeUnit;
  }
}
