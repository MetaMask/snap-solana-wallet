import { assert } from '@metamask/superstruct';
import {
  setTransactionMessageLifetimeUsingBlockhash,
  type CompilableTransactionMessage,
} from '@solana/kit';

import type { Network } from '../../../constants/solana';
import { Base64Struct } from '../../../validation/structs';
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
    assert(base64EncodedString, Base64Struct);

    const transactionMessage =
      await this.#transactionHelper.decodeBase64Encoded(
        base64EncodedString,
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
