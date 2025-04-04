import { getSetComputeUnitLimitInstruction } from '@solana-program/compute-budget';
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstruction,
  getTransferInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import type { CompilableTransactionMessage } from '@solana/kit';
import {
  addSignersToTransactionMessage,
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  fetchJsonParsedAccount,
  getSignatureFromTransaction,
  pipe,
  prependTransactionMessageInstructions,
  sendTransactionWithoutConfirmingFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Account,
  type Address,
  type KeyPairSigner,
  type MaybeAccount,
  type MaybeEncodedAccount,
} from '@solana/kit';
import type BigNumber from 'bignumber.js';

import type { Network } from '../../../constants/solana';
import type { SolanaKeyringAccount } from '../../../handlers/onKeyringRequest/Keyring';
import { deriveSolanaKeypair } from '../../../utils/deriveSolanaKeypair';
import type { ILogger } from '../../../utils/logger';
import { retry } from '../../../utils/retry';
import { toTokenUnits } from '../../../utils/toTokenUnit';
import type { SolanaConnection } from '../../connection';
import type { TransactionHelper } from '../TransactionHelper';
import type { ITransactionMessageBuilder } from './ITransactionMessageBuilder';

export class SendSplTokenBuilder implements ITransactionMessageBuilder {
  readonly #connection: SolanaConnection;

  readonly #transactionHelper: TransactionHelper;

  readonly #logger: ILogger;

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
    from: SolanaKeyringAccount,
    to: Address,
    mint: Address,
    amountInToken: string | number | bigint | BigNumber,
    network: Network,
  ): Promise<CompilableTransactionMessage> {
    this.#logger.log('Build transfer SPL token transaction message');

    const { privateKeyBytes } = await deriveSolanaKeypair({
      index: from.index,
    });
    const signer = await createKeyPairSignerFromPrivateKeyBytes(
      privateKeyBytes,
    );

    // SPL tokens are not held in the wallet's account, they are held in the associated token account.
    // For both the sender and the receiver, we need to get or create the associated token account for the wallet and token mint.
    const fromTokenAccount = await this.getOrCreateAssociatedTokenAccount(
      mint,
      signer.address,
      network,
      signer,
    );

    const toTokenAccount = await this.getOrCreateAssociatedTokenAccount(
      mint,
      to,
      network,
      signer,
    );

    // Fetch the token account
    const tokenAccount = await this.getTokenAccount<MaybeHasDecimals>(
      mint,
      network,
    );

    const decimals = this.getDecimals(tokenAccount);

    // Convert amount based on token decimals
    const amountInTokenUnits = toTokenUnits(amountInToken, decimals);

    const latestBlockhash = await this.#transactionHelper.getLatestBlockhash(
      network,
    );

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayer(signer.address, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) =>
        appendTransactionMessageInstruction(
          getTransferInstruction({
            source: fromTokenAccount.address,
            destination: toTokenAccount.address,
            authority: signer,
            amount: amountInTokenUnits,
          }),
          tx,
        ),
    );

    const estimatedComputeUnits =
      await this.#transactionHelper.getComputeUnitEstimate(
        transactionMessage,
        network,
      );

    const budgetedTransactionMessage = prependTransactionMessageInstructions(
      [getSetComputeUnitLimitInstruction({ units: estimatedComputeUnits })],
      transactionMessage,
    );

    return budgetedTransactionMessage;
  }

  /**
   * Creates or fetches the associated token account for a given wallet and token mint.
   * @param mint - The mint address.
   * @param owner - The owner's address.
   * @param network - The network.
   * @param payer - If the associated token account does not exist, the signer will pay for the transaction creating the associated token account.
   * @returns The associated token account's address.
   */
  async getOrCreateAssociatedTokenAccount<TData extends Uint8Array | object>(
    mint: Address,
    owner: Address,
    network: Network,
    payer?: KeyPairSigner,
  ): Promise<(MaybeAccount<TData> | MaybeEncodedAccount) & Exists> {
    const associatedTokenAccount = await this.getAssociatedTokenAccount(
      mint,
      owner,
      network,
    );

    try {
      SendSplTokenBuilder.assertAccountExists(associatedTokenAccount);
      return associatedTokenAccount as (
        | MaybeAccount<TData>
        | MaybeEncodedAccount
      ) &
        Exists;
    } catch (error) {
      this.#logger.log('Associated token account does not exist. Create it...');
      if (!payer) {
        throw new Error('Payer is required to create associated token account');
      }
      return await this.createAssociatedTokenAccount(
        mint,
        owner,
        network,
        payer,
      );
    }
  }

  /**
   * Derive the associated token account address for a given mint and owner.
   * @param mint - The mint address.
   * @param owner - The owner's address.
   * @returns The associated token account address.
   */
  static async deriveAssociatedTokenAccountAddress(
    mint: Address,
    owner: Address,
  ): Promise<Address> {
    return (
      await findAssociatedTokenPda({
        mint,
        owner,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })
    )[0];
  }

  /**
   * Get the associated token account for a given mint and owner.
   * @param mint - The mint address.
   * @param owner - The owner's address.
   * @param network - The network.
   * @returns The associated token account. Handle with care, it might:
   * - not exist (exists: false).
   * - be encoded (data instanceof Uint8Array).
   */
  async getAssociatedTokenAccount<TData extends Uint8Array | object>(
    mint: Address,
    owner: Address,
    network: Network,
  ): Promise<MaybeAccount<TData> | MaybeEncodedAccount> {
    const associatedTokenAccountAddress =
      await SendSplTokenBuilder.deriveAssociatedTokenAccountAddress(
        mint,
        owner,
      );

    // Fetch the full account and return it if it exists
    const associatedTokenAccount = await this.getTokenAccount<TData>(
      associatedTokenAccountAddress,
      network,
    );

    return associatedTokenAccount;
  }

  /**
   * Create an associated token account for a given mint and owner.
   * @param mint - The mint address.
   * @param owner - The owner's address.
   * @param network - The network.
   * @param payer - The payer's address.
   * @returns The associated token account.
   */
  async createAssociatedTokenAccount<TData extends Uint8Array | object>(
    mint: Address,
    owner: Address,
    network: Network,
    payer: KeyPairSigner,
  ): Promise<(MaybeAccount<TData> | MaybeEncodedAccount) & Exists> {
    const associatedTokenAccountAddress =
      await SendSplTokenBuilder.deriveAssociatedTokenAccountAddress(
        mint,
        owner,
      );

    // Try to get the associated token account. It should not exist.
    const nonExistingAssociatedTokenAccount =
      await this.getAssociatedTokenAccount(mint, owner, network);

    // Throw an error if the associated token account already exists.
    SendSplTokenBuilder.assertAccountNotExists(
      nonExistingAssociatedTokenAccount,
    );

    const latestBlockhash = await this.#transactionHelper.getLatestBlockhash(
      network,
    );

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayer(payer.address, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) =>
        appendTransactionMessageInstructions(
          [
            getCreateAssociatedTokenInstruction({
              payer,
              ata: associatedTokenAccountAddress,
              owner,
              mint,
            }),
          ],
          tx,
        ),
    );

    // Sign the transaction
    const transactionMessageWithSigners = addSignersToTransactionMessage(
      [payer],
      transactionMessage,
    );
    const signedTransaction = await signTransactionMessageWithSigners(
      transactionMessageWithSigners,
    );
    const signature = getSignatureFromTransaction(signedTransaction);

    // Send the transaction
    const rpc = this.#connection.getRpc(network);

    const sendTransactionWithoutConfirming =
      sendTransactionWithoutConfirmingFactory({
        rpc,
      });

    await sendTransactionWithoutConfirming(signedTransaction, {
      commitment: 'confirmed',
    });

    await this.#transactionHelper.waitForTransactionCommitment(
      signature,
      'confirmed',
      network,
    );

    /**
     * When the previous line resolves, the associated token account is in fact not yet created.
     * We need to poll the account until it exists.
     */
    return await retry(async () => {
      const account = await this.getTokenAccount<TData>(
        associatedTokenAccountAddress,
        network,
      );
      SendSplTokenBuilder.assertAccountExists(account);
      return account;
    });
  }

  /**
   * Get the token account for a given mint and network.
   * @param mint - The mint address.
   * @param network - The network.
   * @returns The token account. Handle with care, it might:
   * - not exist (exists: false).
   * - be encoded (data instanceof Uint8Array).
   */
  async getTokenAccount<TData extends Uint8Array | object>(
    mint: Address,
    network: Network,
  ): Promise<MaybeAccount<TData> | MaybeEncodedAccount> {
    const rpc = this.#connection.getRpc(network);
    const tokenAccount = await fetchJsonParsedAccount<TData>(rpc, mint);

    return tokenAccount;
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
}

export type Exists = {
  readonly exists: true;
};

export type MaybeHasDecimals = {
  decimals?: number | undefined | null;
};
