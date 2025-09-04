import { assert } from '@metamask/utils';
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getTransferCheckedInstruction,
} from '@solana-program/token';
import type { CompilableTransactionMessage } from '@solana/kit';
import {
  appendTransactionMessageInstructions,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  pipe,
  prependTransactionMessageInstructions,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Address,
} from '@solana/kit';

import type { TokenHelper } from '../../../core/services';
import type { SolanaConnection } from '../../../core/services/connection';
import type { TransactionHelper } from '../../../core/services/execution/TransactionHelper';
import { deriveSolanaKeypair } from '../../../core/utils/deriveSolanaKeypair';
import { createPrefixedLogger, type ILogger } from '../../../core/utils/logger';
import type {
  BuildSendTransactionParams,
  ISendTransactionBuilder,
} from './ISendTransactionBuilder';

export class SendSplTokenBuilder implements ISendTransactionBuilder {
  readonly #tokenHelper: TokenHelper;

  readonly #connection: SolanaConnection;

  readonly #transactionHelper: TransactionHelper;

  readonly #logger: ILogger;

  /**
   * The transaction built here consumes up to ~30,000 compute units when just transferring
   * to an existing associated token account, but requires ~35,000+ compute units when
   * creating the recipient's associated token account.
   */
  readonly #computeUnitLimit = 40_000;

  readonly #computeUnitPriceMicroLamportsPerComputeUnit = 10000n;

  constructor(
    tokenHelper: TokenHelper,
    connection: SolanaConnection,
    transactionHelper: TransactionHelper,
    logger: ILogger,
  ) {
    this.#tokenHelper = tokenHelper;
    this.#connection = connection;
    this.#transactionHelper = transactionHelper;
    this.#logger = createPrefixedLogger(logger, '[📩 SendSplTokenBuilder]');
  }

  async buildTransactionMessage(
    params: BuildSendTransactionParams,
  ): Promise<CompilableTransactionMessage> {
    this.#logger.log('Build transfer SPL token transaction message');

    const { from, to, mint, amount, network } = params;
    assert(mint, 'Mint is required');

    const mintAccount = await this.#connection.fetchMint(mint, network);

    const {
      programAddress: tokenProgram,
      data: { decimals },
    } = mintAccount;

    /**
     * The user inputs the amount thinking in uiAmount terms,
     * so if the token uses a multiplier, we need to convert that uiAmount to the raw amount
     */
    const rawAmountInLamports = await this.#tokenHelper.uiAmountToAmountForMint(
      mint,
      network,
      amount.toString(),
    );

    const latestBlockhash =
      await this.#transactionHelper.getLatestBlockhash(network);

    const { privateKeyBytes } = await deriveSolanaKeypair({
      entropySource: from.entropySource,
      derivationPath: from.derivationPath,
    });

    const signer =
      await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    const [fromTokenAccountAddress, toTokenAccountAddress] = await Promise.all([
      SendSplTokenBuilder.deriveAssociatedTokenAccountAddress({
        mint,
        owner: signer.address,
        tokenProgram,
      }),
      SendSplTokenBuilder.deriveAssociatedTokenAccountAddress({
        mint,
        owner: to,
        tokenProgram,
      }),
    ]);

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayer(signer.address, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) =>
        appendTransactionMessageInstructions(
          [
            getCreateAssociatedTokenIdempotentInstruction({
              mint,
              payer: signer,
              tokenProgram,
              owner: to,
              ata: toTokenAccountAddress,
            }),
            getTransferCheckedInstruction(
              {
                source: fromTokenAccountAddress,
                mint,
                destination: toTokenAccountAddress,
                authority: signer,
                amount: rawAmountInLamports,
                decimals,
              },
              {
                programAddress: tokenProgram,
              },
            ),
          ],
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
  }

  /**
   * Derive the associated token account address for a given mint and owner.
   *
   * @param params -
   * @param params.mint - The mint address.
   * @param params.owner - The owner's address.
   * @param params.tokenProgram - The token program to use. If not provided, it will be determined automatically.
   * @returns The associated token account address.
   */
  static async deriveAssociatedTokenAccountAddress({
    mint,
    owner,
    tokenProgram,
  }: {
    mint: Address;
    owner: Address;
    tokenProgram: Address;
  }): Promise<Address> {
    return (
      await findAssociatedTokenPda({
        mint,
        owner,
        tokenProgram,
      })
    )[0];
  }

  getComputeUnitLimit(): number {
    return this.#computeUnitLimit;
  }

  getComputeUnitPriceMicroLamportsPerComputeUnit(): bigint {
    return this.#computeUnitPriceMicroLamportsPerComputeUnit;
  }
}

export type Exists = {
  readonly exists: true;
};

export type MaybeHasDecimals = {
  decimals?: number | undefined | null;
};
