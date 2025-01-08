import {
  findAssociatedTokenPda,
  getTransferInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import {
  appendTransactionMessageInstruction,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  fetchJsonParsedAccount,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Account,
  type Address,
  type EncodedAccount,
  type KeyPairSigner,
  type MaybeAccount,
  type MaybeEncodedAccount,
} from '@solana/web3.js';
import type BigNumber from 'bignumber.js';

import type { SolanaCaip2Networks } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import { toTokenUnits } from '../../utils/toTokenUnit';
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

      // Convert amount based on token decimals
      const tokenAccount = await this.getTokenAccount<MaybeHasDecimals>(
        mint,
        network,
      );

      const decimals = this.getDecimals(tokenAccount);
      console.log('🍗decimals', decimals);

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
  ): Promise<Account<TData> | EncodedAccount> {
    // Derive the address of the associated token account
    const associatedTokenAccountAddress = (
      await findAssociatedTokenPda({
        mint,
        owner,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })
    )[0];

    // Fetch the full account
    const associatedTokenAccount = await this.getTokenAccount<TData>(
      associatedTokenAccountAddress,
      network,
    );

    try {
      // Return it, if it exists
      // We intentionally use the "orThrow" method wrapped in a try/catch to benefit from its type narrowing syntax
      this.isAccountExistsOrThrow<TData>(associatedTokenAccount);
      return associatedTokenAccount;
    } catch (error) {
      // The associated token account does not exist, let's create it
      this.#logger.debug(
        'Associated token account does not exist, creating it',
      );

      if (!payer) {
        throw new Error('Payer is required to create associated token account');
      }

      const latestBlockhash = await this.#transactionHelper.getLatestBlockhash(
        network,
      );

      throw new Error('Implement me!');
      //   const transactionMessage = pipe(
      //     createTransactionMessage({ version: 0 }),
      //     (tx) => setTransactionMessageFeePayer(payer.address, tx),
      //     (tx) =>
      //       setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      //     (tx) =>
      //       appendTransactionMessageInstructions(
      //         getCreateAssociatedTokenInstruction({
      //           payer,
      //           mint,
      //           owner,
      //         }),
      //         tx,
      //       ),
      //   );

      //   await this.#transactionHelper.sendTransaction(
      //     transactionMessage,
      //     network,
      //   );

      //   return associatedTokenAccount;
    }
  }

  /**
   * Get the token account for a given mint and network.
   * @param mint - The mint address.
   * @param network - The network.
   * @returns The token account.
   */
  async getTokenAccount<TData extends Uint8Array | object>(
    mint: Address,
    network: SolanaCaip2Networks,
  ): Promise<MaybeAccount<TData> | MaybeEncodedAccount> {
    const rpc = this.#connection.getRpc(network);
    const tokenAccount = await fetchJsonParsedAccount<TData>(rpc, mint);

    if (!tokenAccount.exists) {
      throw new Error('Token account not found');
    }

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
    this.isAccountExistsOrThrow(tokenAccount);
    this.isAccountDecodedOrThrow(tokenAccount);

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
  isAccountExists<TData extends Uint8Array | object>(
    tokenAccount: MaybeAccount<TData> | MaybeEncodedAccount,
  ) {
    return tokenAccount.exists;
  }

  /**
   * Assert that a token account exists.
   * @param tokenAccount - The token account.
   */
  isAccountExistsOrThrow<TData extends Uint8Array | object>(
    tokenAccount: MaybeAccount<TData> | MaybeEncodedAccount,
  ): asserts tokenAccount is (MaybeAccount<TData> | MaybeEncodedAccount) &
    Exists {
    if (!this.isAccountExists(tokenAccount)) {
      throw new Error('Token account does not exist');
    }
  }

  /**
   * Check if a token account is decoded.
   * @param tokenAccount - The token account.
   * @returns Whether the token account is decoded.
   */
  isAccountDecoded<TData extends Uint8Array | object>(
    tokenAccount: MaybeAccount<TData> | MaybeEncodedAccount,
  ) {
    this.isAccountExistsOrThrow(tokenAccount);
    return !(tokenAccount.data instanceof Uint8Array);
  }

  /**
   * Assert that a token account is decoded.
   * @param tokenAccount - The token account.
   */
  isAccountDecodedOrThrow<TData extends Uint8Array | object>(
    tokenAccount: MaybeAccount<TData> | MaybeEncodedAccount,
  ): asserts tokenAccount is Account<Exclude<TData, Uint8Array>> & Exists {
    this.isAccountExistsOrThrow(tokenAccount);
    if (!this.isAccountDecoded(tokenAccount)) {
      throw new Error('Token account is encoded. Implement a decoder.');
    }
  }
}

type Exists = {
  readonly exists: true;
};

type MaybeHasDecimals = {
  decimals?: number | undefined | null;
};
