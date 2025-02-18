import { getSetComputeUnitLimitInstruction } from '@solana-program/compute-budget';
import { getTransferSolInstruction } from '@solana-program/system';
import type {
  Address,
  CompilableTransactionMessage,
  TransactionMessageWithBlockhashLifetime,
} from '@solana/web3.js';
import {
  appendTransactionMessageInstruction,
  createNoopSigner,
  createTransactionMessage,
  pipe,
  prependTransactionMessageInstructions,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/web3.js';
import type BigNumber from 'bignumber.js';

import type { Network } from '../../../constants/solana';
import { solToLamports } from '../../../utils/conversion';
import type { ILogger } from '../../../utils/logger';
import type { TransactionHelper } from '../TransactionHelper';
import type { ITransactionMessageBuilder } from './ITransactionMessageBuilder';

/**
 * Helper class for transferring SOL.
 */
export class SendSolBuilder implements ITransactionMessageBuilder {
  readonly #transactionHelper: TransactionHelper;

  readonly #logger: ILogger;

  constructor(transactionHelper: TransactionHelper, logger: ILogger) {
    this.#transactionHelper = transactionHelper;
    this.#logger = logger;
  }

  /**
   * Build the transaction message for transferring SOL.
   *
   * @param from - The account from which the SOL will be transferred.
   * @param to - The address to which the SOL will be transferred.
   * @param amountInSol - The amount of SOL to transfer.
   * @param network - The network on which to transfer the SOL.
   * @returns The transaction message.
   */
  async buildTransactionMessage(
    from: Address,
    to: Address,
    amountInSol: string | number | bigint | BigNumber,
    network: Network,
  ): Promise<
    CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime
  > {
    try {
      const amountInLamports = BigInt(solToLamports(amountInSol).toString());

      const latestBlockhash = await this.#transactionHelper.getLatestBlockhash(
        network,
      );
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        // Every transaction must state from which account the transaction fee should be debited from,
        // and that account must sign the transaction. Here, we'll make the source account pay the fee.
        (tx) => setTransactionMessageFeePayer(from, tx),
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
              source: createNoopSigner(from),
            }),
            tx,
          ),
      );

      const estimatedComputeUnits =
        await this.#transactionHelper.getComputeUnitEstimate(
          transactionMessage,
          network,
        );

      const budgetedTransactionMessage = prependTransactionMessageInstructions(
        [getSetComputeUnitLimitInstruction({ units: estimatedComputeUnits })],
        transactionMessage,
      );

      return budgetedTransactionMessage;
    } catch (error) {
      this.#logger.error({ error }, 'Error building transaction message');
      throw error;
    }
  }
}
