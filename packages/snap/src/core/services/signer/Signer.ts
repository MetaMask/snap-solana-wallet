import type { Infer } from '@metamask/superstruct';
import type {
  BaseTransactionMessage,
  Transaction,
  TransactionWithLifetime,
} from '@solana/kit';
import {
  addSignersToTransactionMessage,
  createKeyPairFromPrivateKeyBytes,
  createKeyPairSignerFromPrivateKeyBytes,
  isTransactionMessageWithBlockhashLifetime,
  partiallySignTransaction,
  partiallySignTransactionMessageWithSigners,
  pipe,
} from '@solana/kit';

import type { SolanaKeyringAccount } from '../../../entities';
import type { Network } from '../../constants/solana';
import type { DecompileTransactionMessageFetchingLookupTablesConfig } from '../../sdk-extensions/codecs';
import {
  fromBytesToCompilableTransactionMessage,
  fromUnknowBase64StringToTransactionOrTransactionMessage,
} from '../../sdk-extensions/codecs';
import {
  estimateAndOverrideComputeUnitLimit,
  isTransactionMessageWithComputeUnitLimitInstruction,
  isTransactionMessageWithComputeUnitPriceInstruction,
  setComputeUnitPriceInstructionIfMissing,
  setTransactionMessageFeePayerIfMissing,
  setTransactionMessageLifetimeUsingBlockhashIfMissing,
} from '../../sdk-extensions/transaction-messages';
import { deriveSolanaKeypair } from '../../utils/deriveSolanaKeypair';
import { createPrefixedLogger } from '../../utils/logger';
import type { ILogger } from '../../utils/logger';
import type { Base64Struct } from '../../validation/structs';
import type { SolanaConnection } from '../connection';

/**
 * Signer class for signing transactions and transaction messages.
 */
export class Signer {
  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  static readonly defaultComputeUnitPriceInMicroLamportsPerComputeUnit = 10000n;

  constructor(connection: SolanaConnection, logger: ILogger) {
    this.#connection = connection;
    this.#logger = createPrefixedLogger(logger, '[🖋️ Signer]');
  }

  /**
   * Partially signs an arbitrary base64 string, adapting the logic depending on whether
   * the string represents a transaction or a transaction message.
   *
   * - If it's a transaction message, we need to need add all missing fields, then sign it.
   * - If it's a transaction, we need to need add the account's signature.
   *
   * @param base64String - The base64 encoded transaction or transaction message to sign.
   * @param account - The account to sign the transaction or transaction message with.
   * @param network - The network on which the transaction is being sent.
   * @param config - The configuration for the request.
   * @returns The signed transaction.
   * @throws If the base64 string is not a valid transaction or transaction message.
   */
  async partiallySignBase64String(
    base64String: Infer<typeof Base64Struct>,
    account: SolanaKeyringAccount,
    network: Network,
    config?: DecompileTransactionMessageFetchingLookupTablesConfig,
  ): Promise<Transaction> {
    this.#logger.log('Partially sign base64 string', {
      base64String,
      account,
      network,
      config,
    });

    const rpc = this.#connection.getRpc(network);

    // The received base64 string can either represent a transaction or a transaction message.
    const transactionMessageOrTransaction =
      await fromUnknowBase64StringToTransactionOrTransactionMessage(
        base64String,
        rpc,
        config,
      );

    // It's a transaction message, add all missing fields, then partially sign it.
    if ('instructions' in transactionMessageOrTransaction) {
      return this.#prepareAndPartiallySignTransactionMessage(
        transactionMessageOrTransaction,
        account,
        network,
      );
    }

    const isUnsigned = Object.values(
      transactionMessageOrTransaction.signatures,
    ).every((signature) => !signature);

    // It's an unsigned transaction, grab the message from the transaction and apply the same logic as above.
    if (isUnsigned) {
      const { messageBytes } = transactionMessageOrTransaction;

      const transactionMessageFromUnsignedTransaction =
        await fromBytesToCompilableTransactionMessage(
          messageBytes,
          rpc,
          config,
        );

      return this.#prepareAndPartiallySignTransactionMessage(
        transactionMessageFromUnsignedTransaction,
        account,
        network,
      );
    }

    // It's a partially signed transaction, so we cannot alter its content, and we add the account's signature.
    return this.#partiallySignTransaction(
      transactionMessageOrTransaction,
      account,
    );
  }

  /**
   * Prepares the passed transaction message by:
   * - adding a feePayer if missing,
   * - adding a lifetimeConstraint if missing,
   * - adding a computeUnitLimit if missing,
   * - adding a computeUnitPrice if missing,
   * - partially signing it with the passed account.
   *
   * @param transactionMessage - The transaction message to sign.
   * @param account - The account to sign the transaction message with.
   * @param scope - The network where the transaction is to be sent.
   * @returns The partially signed transaction.
   */
  async #prepareAndPartiallySignTransactionMessage(
    transactionMessage: BaseTransactionMessage,
    account: SolanaKeyringAccount,
    scope: Network,
  ): Promise<Readonly<Transaction & TransactionWithLifetime>> {
    // First, make sure the transaction message has a fee payer, lifetime constraint and compute unit price
    const hasLifetimeConstraint =
      isTransactionMessageWithBlockhashLifetime(transactionMessage);

    const blockhash = hasLifetimeConstraint
      ? transactionMessage.lifetimeConstraint // Use any value, it won't be used
      : await this.#connection.getLatestBlockhash(scope);

    const hasComputeUnitPrice =
      isTransactionMessageWithComputeUnitPriceInstruction(transactionMessage);

    const microLamports =
      Signer.defaultComputeUnitPriceInMicroLamportsPerComputeUnit;

    const hasComputeUnitLimit =
      isTransactionMessageWithComputeUnitLimitInstruction(transactionMessage);

    /**
     * We add a compute unit limit if it's missing, but also if we the compute unit price is missing.
     * Why? Because we will add an extra instruction for the compute unit price, which incidentally increases
     * the compute unit consumed by the transaction. So we need to re-estimate the compute unit limit and override it.
     */
    const shouldSetComputeUnitLimit =
      !hasComputeUnitLimit || !hasComputeUnitPrice;

    const { privateKeyBytes } = await deriveSolanaKeypair({
      entropySource: account.entropySource,
      derivationPath: account.derivationPath,
    });
    const signer =
      await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    const compilableTransactionMessage = await pipe(
      transactionMessage,
      (tx) => setTransactionMessageFeePayerIfMissing(signer.address, tx),
      (tx) =>
        setTransactionMessageLifetimeUsingBlockhashIfMissing(blockhash, tx),
      (tx) =>
        setComputeUnitPriceInstructionIfMissing(tx, {
          microLamports,
        }),
      // If the transaction message had no compute unit price, we just added one, so we need to recompute the compute unit limit
      async (tx) =>
        shouldSetComputeUnitLimit
          ? estimateAndOverrideComputeUnitLimit(
              tx,
              this.#connection.getRpc(scope),
            )
          : tx,
    );

    // Attach the signers to the transaction message
    const transactionMessageWithSigners = addSignersToTransactionMessage(
      [signer],
      compilableTransactionMessage,
    );

    /**
     * Partially sign the transaction message with the signers.
     *
     * When we "partially" sign, we only sign with the passed signers, and don't expect the
     * transaction to be fully signed afterwards.
     *
     * It's important to do this because the transaction might also expect signatures from other signers,
     * so we need to return it as is, so that more signers can sign later.
     */
    const signedTransaction = await partiallySignTransactionMessageWithSigners(
      transactionMessageWithSigners,
    );

    return signedTransaction;
  }

  /**
   * Partially signs a transaction with the passed account.
   *
   * @param transaction - The transaction to partially sign.
   * @param account - The account to partially sign the transaction with.
   * @returns The partially signed transaction.
   */
  async #partiallySignTransaction(
    transaction: Transaction,
    account: SolanaKeyringAccount,
  ) {
    const { privateKeyBytes } = await deriveSolanaKeypair({
      entropySource: account.entropySource,
      derivationPath: account.derivationPath,
    });

    const keyPair = await createKeyPairFromPrivateKeyBytes(privateKeyBytes);

    return partiallySignTransaction([keyPair], transaction);
  }
}
