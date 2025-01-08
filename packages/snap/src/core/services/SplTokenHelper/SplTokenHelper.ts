import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstruction,
  getTransferInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import {
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  fetchJsonParsedAccount,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Account,
  type Address,
  type KeyPairSigner,
  type MaybeAccount,
  type MaybeEncodedAccount,
} from '@solana/web3.js';
import type BigNumber from 'bignumber.js';

import type { SolanaCaip2Networks } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import { toTokenUnits } from '../../utils/toTokenUnit';
import { waitUntilNotThrow } from '../../utils/waitUntilNotThrow';
import type { SolanaConnection } from '../connection';
import type { SolanaKeyringAccount } from '../keyring';
import type { TransactionHelper } from '../TransactionHelper/TransactionHelper';

export class SplTokenHelper {
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

  /**
   * Execute a transaction to transfer an SPL token from one account to another.
   *
   * @param from - The account from which the token will be transferred.
   * @param to - The address to which the token will be transferred.
   * @param mint - The mint address of the asset to transfer.
   * @param amountInToken - The amount of the asset to transfer. For instance, 1 to transfer 1 USDC.
   * @param network - The network on which to transfer the asset.
   * @returns The signature of the transaction.
   */
  async transferSplToken(
    from: SolanaKeyringAccount,
    to: Address,
    mint: Address,
    amountInToken: string | number | bigint | BigNumber,
    network: SolanaCaip2Networks,
  ): Promise<string> {
    try {
      console.log('🍗transferSPLToken', {
        from,
        to,
        mint,
        amountInToken,
      });

      console.log('🍗amountInToken', amountInToken);

      const signer = await createKeyPairSignerFromPrivateKeyBytes(
        Uint8Array.from(from.privateKeyBytesAsNum),
      );

      // SPL tokens are not held in the wallet's account, they are held in the associated token account.
      // For both the sender and the receiver, we need to get or create the associated token account for the wallet and token mint.
      const fromTokenAccount = await this.getOrCreateAssociatedTokenAccount(
        mint,
        signer.address,
        network,
        signer,
      );
      console.log('🍗fromTokenAccount.address', fromTokenAccount.address);

      const toTokenAccount = await this.getOrCreateAssociatedTokenAccount(
        mint,
        to,
        network,
        signer,
      );
      console.log('🍗toTokenAccount.address', toTokenAccount.address);

      // Fetch the token account
      const tokenAccount = await this.getTokenAccount<MaybeHasDecimals>(
        mint,
        network,
      );

      const decimals = this.getDecimals(tokenAccount);
      console.log('🍗decimals', decimals);

      // Convert amount based on token decimals
      const amountInTokenUnits = toTokenUnits(amountInToken, decimals);
      console.log('🍗amountInTokenUnits', amountInTokenUnits);

      const latestBlockhash = await this.#transactionHelper.getLatestBlockhash(
        network,
      );

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(signer.address, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
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

      console.log('🍗transactionMessage', transactionMessage);

      return this.#transactionHelper.sendTransaction(
        transactionMessage,
        network,
      );
    } catch (error) {
      this.#logger.error({ error }, 'Error transferring SPL token');
      throw error;
    }
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
    network: SolanaCaip2Networks,
    payer?: KeyPairSigner,
  ): Promise<(MaybeAccount<TData> | MaybeEncodedAccount) & Exists> {
    const associatedTokenAccount = await this.getAssociatedTokenAccount(
      mint,
      owner,
      network,
    );

    try {
      SplTokenHelper.assertAccountExists(associatedTokenAccount);
      return associatedTokenAccount as (
        | MaybeAccount<TData>
        | MaybeEncodedAccount
      ) &
        Exists;
    } catch (error) {
      console.log('🍗proutoutoutou');
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
    network: SolanaCaip2Networks,
  ): Promise<MaybeAccount<TData> | MaybeEncodedAccount> {
    console.log('🍗getAssociatedTokenAccount', { mint, owner, network });
    const associatedTokenAccountAddress =
      await SplTokenHelper.deriveAssociatedTokenAccountAddress(mint, owner);

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
    network: SolanaCaip2Networks,
    payer: KeyPairSigner,
  ): Promise<(MaybeAccount<TData> | MaybeEncodedAccount) & Exists> {
    console.log('🍗createAssociatedTokenAccount', {
      mint,
      owner,
      network,
      payer,
    });
    const associatedTokenAccountAddress =
      await SplTokenHelper.deriveAssociatedTokenAccountAddress(mint, owner);

    // Try to get the associated token account. It should not exist.
    const nonExistingAssociatedTokenAccount =
      await this.getAssociatedTokenAccount(mint, owner, network);

    // Throw an error if the associated token account already exists.
    SplTokenHelper.assertAccountNotExists(nonExistingAssociatedTokenAccount);

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

    console.log('🍗transactionMessage', transactionMessage);

    // Send the transaction to create the associated token account.
    await this.#transactionHelper.sendTransaction(transactionMessage, network);

    /**
     * When the previous line resolves, the associated token account is in fact not yet created.
     * We need to wait for it to be created.
     */
    return await waitUntilNotThrow(async () => {
      const account = await this.getTokenAccount<TData>(
        associatedTokenAccountAddress,
        network,
      );
      SplTokenHelper.assertAccountExists(account);
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
    network: SolanaCaip2Networks,
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
    SplTokenHelper.assertAccountExists(tokenAccount);
    SplTokenHelper.assertAccountDecoded(tokenAccount);

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
    if (!SplTokenHelper.isAccountExists(tokenAccount)) {
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
    if (SplTokenHelper.isAccountExists(tokenAccount)) {
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
    SplTokenHelper.assertAccountExists(tokenAccount);
    return !(tokenAccount.data instanceof Uint8Array);
  }

  /**
   * Assert that a token account is decoded.
   * @param tokenAccount - The token account.
   */
  static assertAccountDecoded<TData extends Uint8Array | object>(
    tokenAccount: MaybeAccount<TData> | MaybeEncodedAccount,
  ): asserts tokenAccount is Account<Exclude<TData, Uint8Array>> & Exists {
    SplTokenHelper.assertAccountExists(tokenAccount);
    if (!SplTokenHelper.isAccountDecoded(tokenAccount)) {
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
