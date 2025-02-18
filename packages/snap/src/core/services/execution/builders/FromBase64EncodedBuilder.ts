import type { TransactionMessageWithBlockhashLifetime } from '@solana/web3.js';
import {
  setTransactionMessageLifetimeUsingBlockhash,
  type CompilableTransactionMessage,
} from '@solana/web3.js';

import type { Network } from '../../../constants/solana';
import type { TransactionHelper } from '../TransactionHelper';
import type { ITransactionMessageBuilder } from './ITransactionMessageBuilder';

/**
 * Builder for creating a transaction message from a base64 encoded transaction.
 */
export class FromBase64EncodedBuilder implements ITransactionMessageBuilder {
  readonly #transactionHelper: TransactionHelper;

  constructor(transactionHelper: TransactionHelper) {
    this.#transactionHelper = transactionHelper;
  }

  async buildTransactionMessage(
    base64EncodedTransaction: string,
    network: Network,
  ): Promise<
    CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime
  > {
    const transactionMessage =
      await this.#transactionHelper.base64DecodeTransaction(
        base64EncodedTransaction,
        network,
      );

    const latestBlockhash = await this.#transactionHelper.getLatestBlockhash(
      network,
    );

    const transactionMessageWithLifetime =
      setTransactionMessageLifetimeUsingBlockhash(
        latestBlockhash,
        transactionMessage,
      );

    return transactionMessageWithLifetime;
  }
}
