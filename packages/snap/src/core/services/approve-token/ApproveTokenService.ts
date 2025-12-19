import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import {
  findAssociatedTokenPda,
  getApproveCheckedInstruction,
} from '@solana-program/token';
import {
  getApproveCheckedInstruction as getApproveCheckedInstruction2022,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '@solana-program/token-2022';
import type { Address, CompilableTransactionMessage } from '@solana/kit';
import {
  appendTransactionMessageInstruction,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  pipe,
  prependTransactionMessageInstructions,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';

import type { SolanaKeyringAccount } from '../../../entities';
import type { Network } from '../../constants/solana';
import { deriveSolanaKeypair } from '../../utils/deriveSolanaKeypair';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { TokenHelper } from '../assets/TokenHelper';
import type { SolanaConnection } from '../connection';

export type ApproveTokenParams = {
  account: SolanaKeyringAccount;
  mint: Address;
  delegate: Address;
  amount: string;
  network: Network;
};

/**
 * Service for building SPL token approval transactions.
 * This allows a delegate to spend tokens on behalf of the token owner.
 */
export class ApproveTokenService {
  readonly #connection: SolanaConnection;

  readonly #tokenHelper: TokenHelper;

  readonly #logger: ILogger;

  /**
   * The approval transaction consumes up to ~10,000 compute units.
   */
  readonly #computeUnitLimit = 10_000;

  readonly #computeUnitPriceMicroLamportsPerComputeUnit = 10000n;

  constructor(
    connection: SolanaConnection,
    tokenHelper: TokenHelper,
    logger: ILogger,
  ) {
    this.#connection = connection;
    this.#tokenHelper = tokenHelper;
    this.#logger = createPrefixedLogger(logger, '[🔐 ApproveTokenService]');
  }

  /**
   * Builds a token approval transaction message.
   *
   * This creates an SPL token `approve` instruction that allows the delegate
   * to spend tokens from the user's associated token account up to the
   * specified amount.
   *
   * @param params - The parameters for building the approval transaction.
   * @returns A promise that resolves to the compilable transaction message.
   */
  async buildApprovalTransactionMessage(
    params: ApproveTokenParams,
  ): Promise<CompilableTransactionMessage> {
    this.#logger.log('Building token approval transaction', {
      mint: params.mint,
      delegate: params.delegate,
      amount: params.amount,
      network: params.network,
    });

    const {
      account: { entropySource, derivationPath },
      mint,
      delegate,
      amount,
      network,
    } = params;

    // Fetch mint info to get decimals and token program
    const [mintAccount, latestBlockhash, { privateKeyBytes }] =
      await Promise.all([
        this.#connection.fetchMint(mint, network),
        this.#connection.getLatestBlockhash(network),
        deriveSolanaKeypair({ entropySource, derivationPath }),
      ]);

    const {
      programAddress: tokenProgram,
      data: { decimals },
    } = mintAccount;

    const signer =
      await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    // Convert UI amount to raw token amount
    const rawAmount = await this.#tokenHelper.uiAmountToAmountForMint(
      mint,
      network,
      amount,
    );

    // Derive the user's Associated Token Account (ATA) address
    const ownerATA = (
      await findAssociatedTokenPda({
        mint,
        owner: signer.address,
        tokenProgram,
      })
    )[0];

    // Create the approve checked instruction using the appropriate token program
    const getApproveInstruction =
      tokenProgram === TOKEN_2022_PROGRAM_ADDRESS
        ? getApproveCheckedInstruction2022
        : getApproveCheckedInstruction;

    const approveInstruction = getApproveInstruction({
      source: ownerATA,
      mint,
      delegate,
      owner: signer,
      amount: rawAmount,
      decimals,
    });

    // Build the transaction message
    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayer(signer.address, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstruction(approveInstruction, tx),
    );

    // Add compute budget instructions
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
}
