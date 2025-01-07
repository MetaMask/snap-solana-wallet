import { getTransferSolInstruction } from '@solana-program/system';
import {
  address,
  appendTransactionMessageInstruction,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/web3.js';
import type BigNumber from 'bignumber.js';

import {
  SOL_TRANSFER_FEE_LAMPORTS,
  type SolanaCaip2Networks,
} from '../../constants/solana';
import { solToLamports } from '../../utils/conversion';
import type { ILogger } from '../../utils/logger';
import { logMaybeSolanaError } from '../../utils/logMaybeSolanaError';
import type { SolanaKeyringAccount } from '../keyring';
import type { TransactionHelper } from '../TransactionHelper/TransactionHelper';

/**
 * Helper class for transferring SOL.
 */
export class TransferSolHelper {
  readonly #transactionHelper: TransactionHelper;

  readonly #logger: ILogger;

  constructor(transactionHelper: TransactionHelper, logger: ILogger) {
    this.#transactionHelper = transactionHelper;
    this.#logger = logger;
  }

  /**
   * Execute a transaction to transfer SOL from one account to another.
   *
   * @param from - The account from which the SOL will be transferred.
   * @param to - The address to which the SOL will be transferred.
   * @param amountInSol - The amount of SOL to transfer.
   * @param network - The network on which to transfer the SOL.
   * @returns The signature of the transaction.
   * @see https://github.com/solana-labs/solana-web3.js/blob/master/examples/transfer-lamports/src/example.ts
   */
  async transferSol(
    from: SolanaKeyringAccount,
    to: string,
    amountInSol: string | number | bigint | BigNumber,
    network: SolanaCaip2Networks,
  ): Promise<string> {
    const amountInLamports = solToLamports(amountInSol);

    const transactionMessage = await this.buildTransactionMessage(
      from,
      to,
      BigInt(amountInLamports.toString()),
      network,
    );

    this.#logger.info(
      `Transaction cost: ${SOL_TRANSFER_FEE_LAMPORTS} lamports`,
    );

    return this.#transactionHelper.sendTransaction(transactionMessage, network);
  }

  /**
   * Build the transaction message for transferring SOL.
   *
   * @param from - The account from which the SOL will be transferred.
   * @param to - The address to which the SOL will be transferred.
   * @param amountInLamports - The amount of SOL to transfer in lamports.
   * @param network - The network on which to transfer the SOL.
   * @returns The transaction message.
   */
  async buildTransactionMessage(
    from: SolanaKeyringAccount,
    to: string,
    amountInLamports: number | bigint,
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
              amount: amountInLamports,
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
}
