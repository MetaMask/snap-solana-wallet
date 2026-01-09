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
import {
  getCreateAssociatedTokenIdempotentInstruction as getCreateAssociatedTokenIdempotentInstruction2022,
  getTransferCheckedInstruction as getTransferCheckedInstruction2022,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '@solana-program/token-2022';
import type { CompilableTransactionMessage, IInstruction } from '@solana/kit';
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

import type { TokenHelper } from '..';
import { deriveSolanaKeypair } from '../../utils/deriveSolanaKeypair';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import {
  RecipientTokenAccountMintMismatchError,
  RecipientUnsupportedError,
} from './errors';
import type {
  BuildSendTransactionParams,
  ISendTransactionBuilder,
} from './ISendTransactionBuilder';
import type { RecipientClassifier } from './RecipientClassifier';

export class SendSplTokenBuilder implements ISendTransactionBuilder {
  readonly #tokenHelper: TokenHelper;

  readonly #recipientClassifier: RecipientClassifier;

  readonly #connection: SolanaConnection;

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
    recipientClassifier: RecipientClassifier,
    connection: SolanaConnection,
    logger: ILogger,
  ) {
    this.#tokenHelper = tokenHelper;
    this.#recipientClassifier = recipientClassifier;
    this.#connection = connection;
    this.#logger = createPrefixedLogger(logger, '[📩 SendSplTokenBuilder]');
  }

  async buildTransactionMessage(
    params: BuildSendTransactionParams,
  ): Promise<CompilableTransactionMessage> {
    this.#logger.log('Build transfer SPL token transaction message');

    const {
      from: { entropySource, derivationPath },
      to: recipientAddress, // Use a local alias because "recipientAddress" is more expressive
      mint,
      amount,
      network,
    } = params;
    assert(mint, 'Mint is required');

    /**
     * Classify the recipient. Depending on whether it's a system account or a token account,
     * we will need to build a transaction with different instructions.
     */
    const recipientClassification = await this.#recipientClassifier.classify(
      recipientAddress,
      network,
    );

    // Early-return to prevent the send if the recipient is unsupported to avoid permanent loss of funds
    if (recipientClassification.type === 'UNSUPPORTED') {
      throw new RecipientUnsupportedError();
    }

    // These can be parallelized for performance
    const [
      mintAccount,
      rawAmountInLamports,
      { privateKeyBytes },
      latestBlockhash,
    ] = await Promise.all([
      this.#connection.fetchMint(mint, network),
      this.#tokenHelper.uiAmountToAmountForMint(
        mint,
        network,
        amount.toString(),
      ),
      deriveSolanaKeypair({ entropySource, derivationPath }),
      this.#connection.getLatestBlockhash(network),
    ]);

    const {
      programAddress: tokenProgram,
      data: { decimals },
    } = mintAccount;

    const signer =
      await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    // Derive the senders's Associated Token Account (ATA) address. Tokens will be sent from here
    const fromATA =
      await SendSplTokenBuilder.deriveAssociatedTokenAccountAddress({
        mint,
        owner: signer.address,
        tokenProgram,
      });

    const instructions: IInstruction[] = [];

    // Use the Token-2022 instructions if the token is a Token-2022 token
    const isToken2022 = tokenProgram === TOKEN_2022_PROGRAM_ADDRESS;
    const createAtaInstruction = isToken2022
      ? getCreateAssociatedTokenIdempotentInstruction2022
      : getCreateAssociatedTokenIdempotentInstruction;
    const transferInstruction = isToken2022
      ? getTransferCheckedInstruction2022
      : getTransferCheckedInstruction;

    switch (recipientClassification.type) {
      // If the recipient is a system account, we send the tokens to the related ATA
      case 'SYSTEM': {
        // Derive the recipient's ATA address
        const recipientATA =
          await SendSplTokenBuilder.deriveAssociatedTokenAccountAddress({
            mint,
            owner: recipientAddress,
            tokenProgram,
          });

        // Add an instruction that creates the recipient's ATA if it doesn't exist
        instructions.push(
          createAtaInstruction({
            mint,
            payer: signer,
            tokenProgram,
            owner: recipientAddress,
            ata: recipientATA,
          }),
        );

        // Add an instruction that transfers the tokens from the sender's ATA to the recipient's ATA
        instructions.push(
          transferInstruction({
            source: fromATA,
            mint,
            destination: recipientATA,
            authority: signer,
            amount: rawAmountInLamports,
            decimals,
          }),
        );
        break;
      }
      // If the recipient is a token account, we send the tokens to it directly
      case 'TOKEN_ACCOUNT': {
        // Verify that the recipient's token account is for the same mint as the one we intend to send
        if (recipientClassification.mint !== mint) {
          throw new RecipientTokenAccountMintMismatchError();
        }

        // Add an instruction that transfers the tokens from the sender's ATA to the recipient's token account
        instructions.push(
          transferInstruction({
            source: fromATA,
            mint,
            destination: recipientAddress,
            authority: signer,
            amount: rawAmountInLamports,
            decimals,
          }),
        );
        break;
      }
      // Prevent the send if the recipient is unsupported to avoid permanent loss of funds
      default:
        throw new RecipientUnsupportedError();
    }

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayer(signer.address, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions(instructions, tx),
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
