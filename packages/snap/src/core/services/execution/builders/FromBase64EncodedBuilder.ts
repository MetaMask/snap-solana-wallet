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
    base64EncodedString: string,
    network: Network,
  ): Promise<CompilableTransactionMessage> {
    let transactionMessage: CompilableTransactionMessage;

    try {
      // In case the string is a base64 encoded transaction message
      transactionMessage =
        await this.#transactionHelper.base64DecodeTransaction(
          base64EncodedString,
          network,
        );
    } catch (error) {
      // In case the string is a base64 encoded transaction
      const base64EncodedTransactionMessage =
        await this.#transactionHelper.base64EncodeTransactionMessageFromBase64EncodedTransaction(
          base64EncodedString,
        );
      transactionMessage =
        await this.#transactionHelper.base64DecodeTransaction(
          base64EncodedTransactionMessage,
          network,
        );
    }

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
