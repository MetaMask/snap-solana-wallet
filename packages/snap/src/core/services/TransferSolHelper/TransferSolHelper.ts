import { getTransferSolInstruction } from '@solana-program/system';
import {
  address,
  appendTransactionMessageInstruction,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendTransactionWithoutConfirmingFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from '@solana/web3.js';

import type { SolanaCaip2Networks } from '../../constants/solana';
import { LAMPORTS_PER_SOL } from '../../constants/solana';
import { getClusterFromScope } from '../../utils/get-cluster-from-scope';
import type { ILogger } from '../../utils/logger';
import { logMaybeSolanaError } from '../../utils/logMaybeSolanaError';
import type { SolanaConnection } from '../connection';
import type { SolanaKeyringAccount } from '../keyring';
import type { TransactionHelper } from '../TransactionHelper/TransactionHelper';

/**
 * Helper class for transferring SOL.
 */
export class TransferSolHelper {
  readonly #transactionHelper: TransactionHelper;

  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  constructor(
    transactionHelper: TransactionHelper,
    connection: SolanaConnection,
    logger: ILogger,
  ) {
    this.#transactionHelper = transactionHelper;
    this.#connection = connection;
    this.#logger = logger;
  }

  /**
   * Helper class for transferring SOL from one account to another.
   *
   * @param from - The account from which the SOL will be transferred.
   * @param to - The address to which the SOL will be transferred.
   * @param amount - The amount of SOL to transfer.
   * @param network - The network on which to transfer the SOL.
   * @returns The signature of the transaction.
   * @see https://github.com/solana-labs/solana-web3.js/blob/master/examples/transfer-lamports/src/example.ts
   */
  async transferSol(
    from: SolanaKeyringAccount,
    to: string,
    amount: number,
    network: SolanaCaip2Networks,
  ): Promise<string> {
    const amountInLamports = lamports(BigInt(amount * LAMPORTS_PER_SOL));

    const sendTransactionWithoutConfirming =
      sendTransactionWithoutConfirmingFactory({
        rpc: this.#connection.getRpc(network),
      });

    /**
     * Since the account to which the tokens will be transferred does not need to sign the transaction
     * to receive them, we only need an address.
     */
    const toAddress = address(to);

    const transactionMessage = await this.buildTransactionMessage(
      from,
      toAddress,
      amountInLamports,
      network,
    );

    const transactionCost =
      await this.#transactionHelper.calculateCostInLamports(
        transactionMessage,
        network,
      );
    console.log(`Transaction cost: ${transactionCost} lamports`);

    const signedTransaction = await signTransactionMessageWithSigners(
      transactionMessage,
    );

    const signature = getSignatureFromTransaction(signedTransaction);

    /**
     * Send and confirm the transaction.
     * Now that the transaction is signed, we send it to an RPC. The RPC will relay it to the Solana
     * network for execution. The `sendAndConfirmTransaction` method will resolve when the transaction
     * is reported to have been confirmed. It will reject in the event of an error (eg. a failure to
     * simulate the transaction), or may timeout if the transaction lifetime is thought to have expired
     * (eg. the network has progressed past the `lastValidBlockHeight` of the transaction's blockhash
     * lifetime constraint).
     */
    const cluster = getClusterFromScope(network)?.toLowerCase() ?? 'mainnet';
    this.#logger.info(
      `Sending transaction: https://explorer.solana.com/tx/${signature}?cluster=${cluster}`,
    );

    try {
      await sendTransactionWithoutConfirming(signedTransaction, {
        commitment: 'confirmed',
      });
      return signature;
    } catch (error: any) {
      logMaybeSolanaError(error, transactionMessage);
      throw error;
    }
  }

  /**
   * Build the transaction message for transferring SOL.
   *
   * @param from - The account from which the SOL will be transferred.
   * @param to - The address to which the SOL will be transferred.
   * @param amountLamports - The amount of SOL to transfer in lamports.
   * @param network - The network on which to transfer the SOL.
   * @returns The transaction message.
   */
  async buildTransactionMessage(
    from: SolanaKeyringAccount,
    to: string,
    amountLamports: number | bigint,
    network: SolanaCaip2Networks,
  ) {
    try {
      const signer = await createKeyPairSignerFromPrivateKeyBytes(
        Uint8Array.from(from.privateKeyBytesAsNum),
      );
      const toAddress = address(to);
      const latestBlockhash = await this.#transactionHelper.getLatestBlockhash(
        network,
      );
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        // Every transaction must state from which account the transaction fee should be debited from,
        // and that account must sign the transaction. Here, we'll make the source account pay the fee.
        (tx) => setTransactionMessageFeePayer(signer.address, tx),
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
              amount: amountLamports,
              destination: toAddress,
              /**
               * By supplying a `TransactionSigner` here instead of just an address, we give this
               * transaction message superpowers. Later the
               * `signTransactionMessageWithSigners` method, in consideration of the fact that the
               * source account must sign System program transfer instructions, will use this
               * `TransactionSigner` to produce a transaction signed on behalf of
               * `from.address`, without any further configuration.
               */
              source: signer,
            }),
            tx,
          ),
      );
      return transactionMessage;
    } catch (error) {
      logMaybeSolanaError(error);
      this.#logger.error({ error }, 'Error building transaction message');
      throw error;
    }
  }

  /**
   * Calculate the cost of a transfer of SOL, in lamports.
   *
   * @param from - The account from which the SOL will be transferred.
   * @param to - The address to which the SOL will be transferred.
   * @param network - The network on which to transfer the SOL.
   * @returns The cost of the transfer in lamports.
   */
  async calculateCostInLamports(
    from: SolanaKeyringAccount,
    to: string,
    network: SolanaCaip2Networks,
  ): Promise<string> {
    /**
     * Build a transaction message with a zero amount.
     * This is because the cost doesn't depend on the amount of SOL being transferred.
     * If we used a given amount of SOL, we would take the risk that the simulated transaction fails in the case where the amount is equal or exceeds the balance of the source account.
     */
    const transactionMessage = await this.buildTransactionMessage(
      from,
      to,
      0,
      network,
    );

    const transactionCost =
      await this.#transactionHelper.calculateCostInLamports(
        transactionMessage,
        network,
      );

    return transactionCost;
  }
}
