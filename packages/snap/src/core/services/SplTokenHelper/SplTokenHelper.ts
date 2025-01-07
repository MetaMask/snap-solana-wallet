import {
  findAssociatedTokenPda,
  getTransferInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import type { Address } from '@solana/web3.js';
import {
  appendTransactionMessageInstruction,
  address as asAddress,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  fetchJsonParsedAccount,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
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
   * @param mintAddress - The mint address of the asset to transfer.
   * @param amountInToken - The amount of the asset to transfer. For instance, 1 to transfer 1 USDC.
   * @param network - The network on which to transfer the asset.
   * @returns The signature of the transaction.
   */
  async transferSPLToken(
    from: SolanaKeyringAccount,
    to: string,
    mintAddress: string,
    amountInToken: string | number | bigint | BigNumber,
    network: SolanaCaip2Networks,
  ): Promise<string> {
    try {
      console.log('🍗transferSPLToken', {
        from,
        to,
        mintAddress,
        amountInToken,
      });

      console.log('🍗amountInToken', amountInToken);

      const signer = await createKeyPairSignerFromPrivateKeyBytes(
        Uint8Array.from(from.privateKeyBytesAsNum),
      );

      // Get the token accounts for both parties
      //   const fromTokenAccount = (
      //     await findAssociatedTokenPda({
      //       mint: asAddress(tokenMintAddress),
      //       owner: signer.address,
      //       tokenProgram: TOKEN_PROGRAM_ADDRESS,
      //     })
      //   )[0];
      const fromTokenAccount = 'G23tQHsbQuh3yqUBoyXDn3TwqEbbbUHAHEeUSvJaVRtA';

      //   const toTokenAccount = (
      //     await findAssociatedTokenPda({
      //       mint: asAddress(tokenMintAddress),
      //       owner: asAddress(to),
      //       tokenProgram: TOKEN_PROGRAM_ADDRESS,
      //     })
      //   )[0];
      const toTokenAccount = 'CSq2wNLSpfKHCdL3E3k1iksbRXWjfnD87b9iy35nL8VP';

      // Convert amount based on token decimals
      const decimals = await this.#getDecimals(mintAddress, network);
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
              source: asAddress(fromTokenAccount),
              destination: asAddress(toTokenAccount),
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
   * @param payer - The payer's address.
   * @param walletAddress - The wallet's address.
   * @param mintAddress - The token mint's address.
   * @param network - The network on which to create the associated token account.
   * @returns The associated token account's address.
   */
  async #getOrCreateAssociatedTokenAccount(
    payer: Address,
    walletAddress: Address,
    mintAddress: Address,
    network: SolanaCaip2Networks,
  ): Promise<Address> {
    // Find the associated token account address
    const associatedTokenAccount = (
      await findAssociatedTokenPda({
        mint: asAddress(mintAddress),
        owner: asAddress(walletAddress),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })
    )[0];

    // Check if the associated token account exists
    const accountInfo = await this.#transactionHelper.getAccountInfo(
      associatedTokenAccount,
      network,
    );

    if (accountInfo) {
      this.#logger.debug(
        'Associated token account already exists:',
        associatedTokenAccount,
      );
      return asAddress(associatedTokenAccount);
    }

    throw new Error('Associated token account not found');

    // this.#logger.debug(
    //   'Creating associated token account:',
    //   associatedTokenAccount,
    // );

    // const latestBlockhash = await this.#transactionHelper.getLatestBlockhash(
    //   network,
    // );

    // const transactionMessage = pipe(
    //   createTransactionMessage({ version: 0 }),
    //   (tx) => setTransactionMessageFeePayer(payer, tx),
    //   (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    //   (tx) =>
    //     appendTransactionMessageInstructions(
    //       getCreateAssociatedTokenInstruction({
    //         payer,
    //         mint: asAddress(mintAddress),
    //         owner: asAddress(walletAddress),
    //       }),
    //       tx,
    //     ),
    // );

    // await this.#transactionHelper.sendTransaction(transactionMessage, network);

    // return associatedTokenAccount;
  }

  /**
   * Get the decimals of a given mint address.
   * @param mintAddress - The mint address.
   * @param network - The network.
   * @returns The decimals.
   */
  async #getDecimals(
    mintAddress: string,
    network: SolanaCaip2Networks,
  ): Promise<number> {
    const rpc = this.#connection.getRpc(network);

    type TokenData = { decimals: number };
    const tokenAccountInfo = await fetchJsonParsedAccount<TokenData>(
      rpc,
      asAddress(mintAddress),
    );
    console.log('🍗tokenAccountInfo', tokenAccountInfo);

    if (!tokenAccountInfo.exists) {
      throw new Error('Token account not found');
    }

    if (!('decimals' in tokenAccountInfo.data)) {
      throw new Error(
        'No decimals found in token data. The token data might be encoded; in this case, implement a decoder for the token data.',
      );
    }
    const { decimals } = tokenAccountInfo.data;

    if (!decimals) {
      throw new Error(`Decimals not found for ${mintAddress}`);
    }

    return decimals;
  }
}
