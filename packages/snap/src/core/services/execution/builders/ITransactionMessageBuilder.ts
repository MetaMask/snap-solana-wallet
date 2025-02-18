import type {
  CompilableTransactionMessage,
  TransactionMessageWithBlockhashLifetime,
} from '@solana/web3.js';

/**
 * A transaction message builder is a class that can build a transaction message.
 * The transaction message can then be signed, and sent to the network.
 */
export type ITransactionMessageBuilder = {
  buildTransactionMessage(
    ...args: unknown[]
  ): Promise<
    CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime
  >;
};
