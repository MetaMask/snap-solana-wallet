import { assert, Duration } from '@metamask/utils';
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
import { fetchMint } from '@solana-program/token-2022';
import type {
  CompilableTransactionMessage,
  GetAccountInfoApi,
  GetTokenAccountsByOwnerApi,
  Rpc,
} from '@solana/kit';
import {
  appendTransactionMessageInstructions,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  fetchJsonParsedAccount,
  pipe,
  prependTransactionMessageInstructions,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Account,
  type Address,
  type MaybeAccount,
  type MaybeEncodedAccount,
} from '@solana/kit';

import type { ICache } from '../../../core/caching/ICache';
import { useCache } from '../../../core/caching/useCache';
import type { Serializable } from '../../../core/serialization/types';
import { TokenHelper } from '../../../core/services/assets/TokenHelper';
import type { SolanaConnection } from '../../../core/services/connection';
import type { TransactionHelper } from '../../../core/services/execution/TransactionHelper';
import { deriveSolanaKeypair } from '../../../core/utils/deriveSolanaKeypair';
import { createPrefixedLogger, type ILogger } from '../../../core/utils/logger';
import type {
  BuildSendTransactionParams,
  ISendTransactionBuilder,
} from './ISendTransactionBuilder';

export class SendSplTokenBuilder implements ISendTransactionBuilder {
  readonly #connection: SolanaConnection;

  readonly #transactionHelper: TransactionHelper;

  readonly #logger: ILogger;

  readonly #cache: ICache<Serializable>;

  /**
   * The transaction built here consumes up to ~30,000 compute units when just transferring
   * to an existing associated token account, but requires ~35,000+ compute units when
   * creating the recipient's associated token account.
   */
  readonly #computeUnitLimit = 40_000;

  readonly #computeUnitPriceMicroLamportsPerComputeUnit = 10000n;

  /**
   * We cache the mint a token accounts for 1 minute to avoid making too many requests to the RPC.
   * It's needed because in the Send flow, a message is rebuilt every time the user inputs an amount.
   */
  readonly #cacheTtlsMilliseconds = {
    mintAccount: Duration.Minute,
    tokenAccount: Duration.Minute,
  };

  constructor(
    connection: SolanaConnection,
    transactionHelper: TransactionHelper,
    logger: ILogger,
    cache: ICache<Serializable>,
  ) {
    this.#connection = connection;
    this.#transactionHelper = transactionHelper;
    this.#logger = createPrefixedLogger(logger, '[📩 SendSplTokenBuilder]');
    this.#cache = cache;
  }

  async buildTransactionMessage(
    params: BuildSendTransactionParams,
  ): Promise<CompilableTransactionMessage> {
    this.#logger.log('Build transfer SPL token transaction message');

    const { from, to, mint, amount, network } = params;
    assert(mint, 'Mint is required');

    const rpc = this.#connection.getRpc(network);

    const fetchMintCached = useCache<
      [Rpc<GetAccountInfoApi>, Address],
      Account<Mint, any> & Serializable
    >(fetchMint as any, this.#cache, {
      ttlMilliseconds: this.#cacheTtlsMilliseconds.mintAccount,
      functionName: 'fetchMint',
    });

    const fetchJsonParsedAccountCached = useCache<
      [Rpc<GetTokenAccountsByOwnerApi>, Address],
      MaybeAccount<any> | (MaybeEncodedAccount & Serializable)
    >(fetchJsonParsedAccount as any, this.#cache, {
      ttlMilliseconds: this.#cacheTtlsMilliseconds.tokenAccount,
      functionName: 'fetchJsonParsedAccount',
    });

    const [mintAccount, splTokenTokenAccount] = await Promise.all([
      fetchMintCached(rpc, mint),
      fetchJsonParsedAccountCached(rpc, mint),
    ]);

    SendSplTokenBuilder.assertAccountExists(splTokenTokenAccount);

    const tokenProgram = splTokenTokenAccount.programAddress;
    const decimals = this.getDecimals(splTokenTokenAccount);

    /**
     * The user inputs the amount thinking in uiAmount terms,
     * so if the token uses a multiplier, we need to convert that uiAmount to the raw amount
     */
    const rawAmountInLamports = TokenHelper.uiAmountToAmountForMint(
      mintAccount,
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
}

export type Exists = {
  readonly exists: true;
};

export type MaybeHasDecimals = {
  decimals?: number | undefined | null;
};
