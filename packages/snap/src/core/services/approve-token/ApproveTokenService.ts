import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import {
  findAssociatedTokenPda,
  getApproveInstruction,
  getCreateAssociatedTokenInstruction,
} from '@solana-program/token';
import {
  getApproveInstruction as getApproveInstruction2022,
  getCreateAssociatedTokenInstruction as getCreateAssociatedTokenInstruction2022,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '@solana-program/token-2022';
import type {
  Address,
  CompilableTransactionMessage,
  IInstruction,
} from '@solana/kit';
import {
  appendTransactionMessageInstructions,
  assertAccountExists,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';

import type { SolanaKeyringAccount } from '../../../entities';
import type { Network } from '../../constants/solana';
import { deriveSolanaKeypair } from '../../utils/deriveSolanaKeypair';
import { createPrefixedLogger } from '../../utils/logger';
import type { ILogger } from '../../utils/logger';
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
   * The transaction built here consumes up to ~10,000 compute units when approving
   * an existing associated token account, but requires ~30,000+ compute units when
   * creating the user's associated token account. Same as `SendSplTokenBuilder`.
   */
  readonly #computeUnitLimit = 40_000;

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

    // Fetch mint info to get the token program
    const [mintAccount, latestBlockhash, { privateKeyBytes }] =
      await Promise.all([
        this.#connection.fetchMint(mint, network),
        this.#connection.getLatestBlockhash(network),
        deriveSolanaKeypair({ entropySource, derivationPath }),
      ]);

    const { programAddress: tokenProgram } = mintAccount;

    const signer =
      await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    // Derive the user's Associated Token Account (ATA) address
    const ownerATA = (
      await findAssociatedTokenPda({
        mint,
        owner: signer.address,
        tokenProgram,
      })
    )[0];

    // Convert UI amount to raw token amount and check ATA existence in parallel
    const [rawAmount, ownerAtaAccount] = await Promise.all([
      this.#tokenHelper.uiAmountToAmountForMint(mint, network, amount),
      this.#connection.fetchJsonParsedAccount(ownerATA, network, undefined, {
        skipCache: true,
      }),
    ]);

    let ataExists = false;
    try {
      assertAccountExists(ownerAtaAccount);
      ataExists = true;
    } catch {
      // ATA doesn't exist yet, it will be created below
    }

    const isToken2022 = tokenProgram === TOKEN_2022_PROGRAM_ADDRESS;

    const instructions: IInstruction[] = [];

    // Only create the ATA if it doesn't already exist.
    // Uses `Create` (not `CreateIdempotent`) because the card partner
    // only detects the standard Create instruction.
    if (!ataExists) {
      const getCreateAtaInstructionFn = isToken2022
        ? getCreateAssociatedTokenInstruction2022
        : getCreateAssociatedTokenInstruction;

      instructions.push(
        getCreateAtaInstructionFn({
          ata: ownerATA,
          mint,
          owner: signer.address,
          payer: signer,
          tokenProgram,
        }),
      );
    }

    // TODO: When Baanx correctly indexes it, this should be switched back
    // to `getApproveCheckedInstruction2022` and `getApproveCheckedInstruction`
    const getApproveInstructionFn = isToken2022
      ? getApproveInstruction2022
      : getApproveInstruction;

    instructions.push(
      getApproveInstructionFn({
        source: ownerATA,
        delegate,
        owner: signer,
        amount: rawAmount,
      }),
    );

    // Build the transaction message with instructions in order:
    // SetComputeUnitPrice, Create (if needed), Approve, SetComputeUnitLimit
    const allInstructions: IInstruction[] = [
      getSetComputeUnitPriceInstruction({
        microLamports: this.#computeUnitPriceMicroLamportsPerComputeUnit,
      }),
      ...instructions,
      getSetComputeUnitLimitInstruction({ units: this.#computeUnitLimit }),
    ];

    return pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayer(signer.address, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions(allInstructions, tx),
    );
  }
}
