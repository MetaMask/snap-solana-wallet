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
import type { Mint } from '@solana-program/token-2022';
import {
  amountToUiAmountForInterestBearingMintWithoutSimulation,
  fetchMint,
} from '@solana-program/token-2022';
import type { CompilableTransactionMessage } from '@solana/kit';
import {
  appendTransactionMessageInstructions,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  fetchJsonParsedAccount,
  isSome,
  pipe,
  prependTransactionMessageInstructions,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Account,
  type Address,
  type MaybeAccount,
  type MaybeEncodedAccount,
} from '@solana/kit';
import BigNumber from 'bignumber.js';

import type { SolanaConnection } from '../../../core/services/connection';
import type { TransactionHelper } from '../../../core/services/execution/TransactionHelper';
import { deriveSolanaKeypair } from '../../../core/utils/deriveSolanaKeypair';
import type { ILogger } from '../../../core/utils/logger';
import { toTokenUnits } from '../../../core/utils/toTokenUnit';
import type {
  BuildSendTransactionParams,
  ISendTransactionBuilder,
} from './ISendTransactionBuilder';

export class SendSplTokenBuilder implements ISendTransactionBuilder {
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
    connection: SolanaConnection,
    transactionHelper: TransactionHelper,
    logger: ILogger,
  ) {
    this.#connection = connection;
    this.#transactionHelper = transactionHelper;
    this.#logger = logger;
  }

  async buildTransactionMessage(
    params: BuildSendTransactionParams,
  ): Promise<CompilableTransactionMessage> {
    this.#logger.log('Build transfer SPL token transaction message');

    const { from, to, mint, amount, network } = params;
    assert(mint, 'Mint is required');

    const rpc = this.#connection.getRpc(network);

    const [mintAccount, splTokenTokenAccount] = await Promise.all([
      fetchMint(rpc, mint),
      fetchJsonParsedAccount<MaybeHasDecimals>(rpc, mint),
    ]);

    SendSplTokenBuilder.assertAccountExists(splTokenTokenAccount);

    const tokenProgram = splTokenTokenAccount.programAddress;
    const decimals = this.getDecimals(splTokenTokenAccount);

    /**
     * The user inputs the amount thinking in uiAmount terms,
     * so if the token uses a multiplier, we need to convert that uiAmount to the raw amount
     */
    const multiplier = this.#extractMultiplier(mintAccount);
    const rawAmount = BigNumber(amount.toString())
      .dividedBy(multiplier)
      .toNumber();
    const amountInTokenUnits = toTokenUnits(rawAmount, decimals);

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
                amount: amountInTokenUnits,
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

  /**
   * Get the decimals of a given token account.
   * @param tokenAccount - The token account.
   * @returns The decimals.
   */
  getDecimals<TData extends Uint8Array | MaybeHasDecimals>(
    tokenAccount: MaybeAccount<TData> | MaybeEncodedAccount,
  ): number {
    SendSplTokenBuilder.assertAccountExists(tokenAccount);
    SendSplTokenBuilder.assertAccountDecoded(tokenAccount);

    const { decimals } = tokenAccount.data;

    if (!decimals) {
      throw new Error(`Decimals not found for ${tokenAccount}`);
    }

    return decimals;
  }

  /**
   * Check if a token account exists.
   * @param tokenAccount - The token account.
   * @returns Whether the token account exists.
   */
  static isAccountExists<TData extends Uint8Array | object>(
    tokenAccount: MaybeAccount<TData> | MaybeEncodedAccount,
  ): boolean {
    return tokenAccount.exists;
  }

  /**
   * Assert that a token account exists.
   * @param tokenAccount - The token account.
   */
  static assertAccountExists<TData extends Uint8Array | object>(
    tokenAccount: MaybeAccount<TData> | MaybeEncodedAccount,
  ): asserts tokenAccount is (MaybeAccount<TData> | MaybeEncodedAccount) &
    Exists {
    if (!SendSplTokenBuilder.isAccountExists(tokenAccount)) {
      throw new Error('Token account does not exist');
    }
  }

  /**
   * Assert that a token account does not exists.
   * @param tokenAccount - The token account.
   */
  static assertAccountNotExists<TData extends Uint8Array | object>(
    tokenAccount: MaybeAccount<TData> | MaybeEncodedAccount,
  ): asserts tokenAccount is (MaybeAccount<TData> | MaybeEncodedAccount) &
    Exists {
    if (SendSplTokenBuilder.isAccountExists(tokenAccount)) {
      throw new Error('Token account exists');
    }
  }

  /**
   * Check if a token account is decoded.
   * @param tokenAccount - The token account.
   * @returns Whether the token account is decoded.
   */
  static isAccountDecoded<TData extends Uint8Array | object>(
    tokenAccount: MaybeAccount<TData> | MaybeEncodedAccount,
  ): boolean {
    SendSplTokenBuilder.assertAccountExists(tokenAccount);
    return !(tokenAccount.data instanceof Uint8Array);
  }

  /**
   * Assert that a token account is decoded.
   * @param tokenAccount - The token account.
   */
  static assertAccountDecoded<TData extends Uint8Array | object>(
    tokenAccount: MaybeAccount<TData> | MaybeEncodedAccount,
  ): asserts tokenAccount is Account<Exclude<TData, Uint8Array>> & Exists {
    SendSplTokenBuilder.assertAccountExists(tokenAccount);
    if (!SendSplTokenBuilder.isAccountDecoded(tokenAccount)) {
      throw new Error('Token account is encoded. Implement a decoder.');
    }
  }

  getComputeUnitLimit(): number {
    return this.#computeUnitLimit;
  }

  getComputeUnitPriceMicroLamportsPerComputeUnit(): bigint {
    return this.#computeUnitPriceMicroLamportsPerComputeUnit;
  }

  /**
   * Extracts the multiplier from a mint account, accounting for special extensions such as
   * interest bearing or scaled UI amount mints. If no extension is present, returns 1.
   *
   * This is used for cosmetic balance calculations (e.g., yield, dividends, splits) and does not
   * affect the token program's internal transfer logic.
   *
   * Adapted from @solana-labs token-2022 implementation.
   * @see https://github.com/solana-program/token-2022/blob/rust-legacy%40v0.17.0/clients/js/src/amountToUiAmount.ts#L261
   * @param mintAccount - The mint account to extract the multiplier from.
   * @returns The multiplier as a number.
   */
  #extractMultiplier(mintAccount: Account<Mint, any>): number {
    const { extensions, decimals } = mintAccount.data;
    // assert(decimals, 'Decimals not found for mint account');

    // Check for interest bearing mint extension
    const interestBearingMintConfigState: any =
      isSome(extensions) &&
      extensions.value.find(
        (item: any) => item.__kind === 'InterestBearingConfig',
      );

    // Check for scaled UI amount extension
    const scaledUiAmountConfig: any =
      isSome(extensions) &&
      extensions.value.find(
        (item: any) => item.__kind === 'ScaledUiAmountConfig',
      );

    // If no special extension, default to the neutral value
    if (!interestBearingMintConfigState && !scaledUiAmountConfig) {
      const multiplier = 1;
      return multiplier;
    }

    // Get timestamp if needed for special mint types
    const timestamp = Date.now() / 1000;

    // Handle interest bearing mint
    if (interestBearingMintConfigState) {
      // This method from the Solana program token-2022 library calculates the UI amount based on the passed amount.
      // Passing an amount of 1n will return an uiAmount equal to the multiplier.
      const uiAmount = amountToUiAmountForInterestBearingMintWithoutSimulation(
        1n,
        decimals,
        Number(timestamp),
        Number(interestBearingMintConfigState.lastUpdateTimestamp),
        Number(interestBearingMintConfigState.initializationTimestamp),
        interestBearingMintConfigState.preUpdateAverageRate,
        interestBearingMintConfigState.currentRate,
      );
      const multiplier = BigNumber(uiAmount)
        .multipliedBy(10 ** decimals)
        .toNumber();
      return multiplier;
    }

    // At this point, we know it must be a scaled UI amount mint
    if (scaledUiAmountConfig) {
      // Use new multiplier if it's effective
      const shouldUseNewMultiplier =
        timestamp >= scaledUiAmountConfig.newMultiplierEffectiveTimestamp;

      const multiplier = shouldUseNewMultiplier
        ? scaledUiAmountConfig.newMultiplier
        : scaledUiAmountConfig.multiplier;

      return multiplier;
    }

    // This should never happen due to the conditions above
    throw new Error('Unknown mint extension type');
  }
}

export type Exists = {
  readonly exists: true;
};

export type MaybeHasDecimals = {
  decimals?: number | undefined | null;
};
