import {
  parseSetComputeUnitLimitInstruction,
  parseSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import type {
  CompiledTransactionMessage,
  IInstructionWithData,
  Transaction as KitTransaction,
  Lamports,
} from '@solana/kit';
import { lamports, pipe } from '@solana/kit';
import BigNumber from 'bignumber.js';

import { parseInstruction } from '../../entities';
import type { ParsedSecp256Instruction } from '../../entities/instructions/programs/secp256k1-secp256r1';
import {
  isSecp256k1Instruction,
  isSecp256r1Instruction,
} from '../../entities/instructions/programs/secp256k1-secp256r1';
import { MICRO_LAMPORTS_PER_LAMPORTS } from '../constants/solana';
import {
  isComputeUnitLimitInstruction,
  isComputeUnitPriceInstruction,
} from '../sdk-extensions/transaction-messages';
import type { SolanaTransaction } from '../types/solana';
import { FeeCalculatorUnsupportedInputTypeError } from './errors';
import { normalizeBase64EncodedTransaction } from './normalizers/normalizeBase64EncodedTransaction';
import { normalizeBase64EncodedTransactionMessage } from './normalizers/normalizeBase64EncodedTransactionMessage';
import { normalizeCompiledTransactionMessage } from './normalizers/normalizeCompiledTransactionMessage';
import { normalizeKitTransaction } from './normalizers/normalizeKitTransaction';
import { normalizeSolanaTransaction } from './normalizers/normalizeSolanaTransaction';
import type { NormalizableInput, NormalizedInput } from './normalizers/types';

/**
 * Base fee per signature in lamports
 */
const BASE_FEE_PER_SIGNATURE = 5000n;

type FeeBreakdown = {
  ed25519SignaturesCount: number;
  secp256k1SignaturesCount: number;
  secp256r1SignaturesCount: number;
  /** Is equal to ed25519SignaturesCount + secp256k1SignaturesCount + secp256r1SignaturesCount */
  totalSignaturesCount: number;
  /** Is equal to 5000 * totalSignaturesCount */
  baseFee: Lamports;
  computeUnitLimit: number;
  computeUnitPriceMicroLamportsPerComputeUnit: bigint;
  /** Is equal to computeUnitLimit * computeUnitPriceMicroLamportsPerComputeUnit, modulo units */
  priorityFee: Lamports;
  /** Is equal to baseFee + priorityFee */
  totalFee: Lamports;
};

/**
 * Utility class to calculate the fees for a Solana transaction.
 *
 * This class provides offline fee calculation capabilities for Solana transactions,
 * supporting multiple input formats and various signature types. It calculates both
 * base fees (based on signature count) and priority fees (based on compute unit
 * limits and prices).
 *
 * **Key Features:**
 * - Offline-first design - no network access required
 * - Supports multiple input formats (SolanaTransaction, Kit Transaction, base64 strings)
 * - Handles different signature types (ed25519, secp256k1, secp256r1)
 * - Accurate fee calculation following Solana's fee structure
 *
 * **Supported Input Types:**
 * - `SolanaTransaction` - Raw transaction data from RPC responses
 * - `Transaction` (aliased `KitTransaction` to avoid confusion) - `@solana/kit` transaction objects
 * - `string` - Base64 encoded transaction data
 *
 * @example
 * ```typescript
 * // Calculate fees for a SolanaTransaction
 * const solanaTx: SolanaTransaction = { ... };
 * const feeBreakdown = FeeCalculator.calculateFee(solanaTx);
 * console.log(`Total fee: ${feeBreakdown.totalFee} lamports`);
 * ```
 * @example
 * ```typescript
 * // Calculate fees for a Kit Transaction
 * const kitTx: Transaction = { ... };
 * const feeBreakdown = FeeCalculator.calculateFee(kitTx);
 * console.log(`Base fee: ${feeBreakdown.baseFee}, Priority fee: ${feeBreakdown.priorityFee}`);
 * ```
 * @example
 * ```typescript
 * // Calculate fees for a base64 encoded transaction
 * const base64Tx = "AWNHdgBrkCqvrksueTwor+5taOgd/fkS8TUavpK5+MhER3+b3fx0AdM+CvpLQ8f3x+9NBzwts66BC/bfqPkAzAKAAQACBJmwAo+dnq8yhuKR7QpXgj+5yPFMzVwViEudWE9Z+N903bOu6UdCGJS9VyhRo8wvswWSAO709XY+51AU1MALO6wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAdazMubIOjxUiTY/+xWYNSffhgTb7vd9LWQ0sI2iMMSoDAwAFAiwBAAADAAkD6AMAAAAAAAACAgABDAIAAABAQg8AAAAAAAA=";
 * const feeBreakdown = FeeCalculator.calculateFee(base64Tx);
 * console.log(`Signatures: ${feeBreakdown.totalSignaturesCount}`);
 * ```
 */
export class FeeCalculator {
  /**
   * Calculates the complete fee breakdown for a Solana transaction.
   *
   * This method analyzes the transaction to determine all fee components:
   * - **Base Fee**: 5000 lamports per signature (ed25519, secp256k1, secp256r1).
   * - **Priority Fee**: Calculated from compute unit limit × compute unit price.
   * - **Total Fee**: Sum of base fee and priority fee.
   *
   * The method automatically detects and counts different signature types:
   * - Standard ed25519 signatures from the transaction's signature array.
   * - secp256k1 signatures from instruction data.
   * - secp256r1 signatures from instruction data.
   *
   * @param input - The transaction to analyze. Can be a `SolanaTransaction`, a `@solana/kit` `Transaction`, or base64 string.
   * @returns A detailed fee breakdown object containing signature counts, base fee, priority fee, and total fee.
   * @example
   * ```typescript
   * const transaction = { ... };
   * const fees = FeeCalculator.calculateFee(transaction);
   *
   * console.log(`Total signatures: ${fees.totalSignaturesCount}`);
   * console.log(`Base fee: ${fees.baseFee} lamports`);
   * console.log(`Priority fee: ${fees.priorityFee} lamports`);
   * console.log(`Total fee: ${fees.totalFee} lamports`);
   * ```
   * @example
   * ```typescript
   * // Handle different signature types
   * const fees = FeeCalculator.calculateFee(transaction);
   * if (fees.secp256k1SignaturesCount > 0) {
   *   console.log(`Transaction includes ${fees.secp256k1SignaturesCount} secp256k1 signatures`);
   * }
   * ```
   */
  static calculateFee(input: NormalizableInput): FeeBreakdown {
    const normalizedInput = this.#normalizeInput(input);

    const {
      ed25519SignaturesCount,
      secp256k1SignaturesCount,
      secp256r1SignaturesCount,
      totalSignaturesCount,
    } = this.#countSignatures(normalizedInput);

    const baseFee = this.#calculateBaseFee(totalSignaturesCount);

    const computeUnitLimit = this.#getComputeUnitLimit(normalizedInput);
    const computeUnitPriceMicroLamportsPerComputeUnit =
      this.#getComputeUnitPriceMicroLamportsPerComputeUnit(normalizedInput);

    const priorityFee = this.#calculatePriorityFee(
      computeUnitLimit,
      computeUnitPriceMicroLamportsPerComputeUnit,
    );

    const totalFee = lamports(baseFee + priorityFee);

    return {
      ed25519SignaturesCount,
      secp256k1SignaturesCount,
      secp256r1SignaturesCount,
      totalSignaturesCount,
      baseFee,
      computeUnitLimit,
      computeUnitPriceMicroLamportsPerComputeUnit,
      priorityFee,
      totalFee,
    };
  }

  /**
   * Calculates the base fee from the total signatures count.
   * @param totalSignaturesCount - Total signatures count.
   * @returns Base fee in lamports.
   */
  static #calculateBaseFee(totalSignaturesCount: number): Lamports {
    return lamports(BASE_FEE_PER_SIGNATURE * BigInt(totalSignaturesCount));
  }

  static #getComputeUnitLimit(normalizedInput: NormalizedInput): number {
    const { instructions } = normalizedInput;
    const computeUnitLimitInstruction = instructions.find(
      isComputeUnitLimitInstruction,
    );

    if (!computeUnitLimitInstruction) {
      return 0;
    }

    return parseSetComputeUnitLimitInstruction(
      computeUnitLimitInstruction as IInstructionWithData<Uint8Array>,
    ).data.units;
  }

  static #getComputeUnitPriceMicroLamportsPerComputeUnit(
    normalizedInput: NormalizedInput,
  ): bigint {
    const { instructions } = normalizedInput;
    const computeUnitPriceInstruction = instructions.find(
      isComputeUnitPriceInstruction,
    );

    if (!computeUnitPriceInstruction) {
      return 0n;
    }

    return parseSetComputeUnitPriceInstruction(
      computeUnitPriceInstruction as IInstructionWithData<Uint8Array>,
    ).data.microLamports;
  }

  /**
   * Calculates the priority fee for a transaction.
   * @param computeUnitLimit - Compute unit limit.
   * @param getComputeUnitPriceMicroLamportsPerComputeUnit - Compute unit price.
   * @returns Priority fee in lamports.
   */
  static #calculatePriorityFee(
    computeUnitLimit: number,
    getComputeUnitPriceMicroLamportsPerComputeUnit: bigint,
  ): Lamports {
    return pipe(
      computeUnitLimit,
      (value) => BigNumber(value),
      (value) =>
        value.multipliedBy(
          getComputeUnitPriceMicroLamportsPerComputeUnit.toString(),
        ),
      (value) =>
        value.dividedToIntegerBy(MICRO_LAMPORTS_PER_LAMPORTS.toString()),
      (value) => value.toString(),
      BigInt,
      lamports,
    );
  }

  /**
   * Counts all signature types in the transaction.
   * @param normalizedInput - Normalized input.
   * @returns Object with counts of each signature type.
   */
  static #countSignatures(normalizedInput: NormalizedInput): {
    ed25519SignaturesCount: number;
    secp256k1SignaturesCount: number;
    secp256r1SignaturesCount: number;
    totalSignaturesCount: number;
  } {
    const { ed25519Signatures, instructions } = normalizedInput;

    // Count ed25519 signatures (standard transaction signatures)
    const ed25519Count = ed25519Signatures.length;

    // Count secp256k1 signatures from instructions
    const secp256k1Count = instructions
      .filter(isSecp256k1Instruction)
      .map(parseInstruction)
      .reduce(
        (acc, instruction) =>
          acc +
          ((instruction.parsed as ParsedSecp256Instruction)?.data
            .numSignatures ?? 0),
        0,
      );

    // Count secp256r1 signatures from instructions
    const secp256r1Count = instructions
      .filter(isSecp256r1Instruction)
      .map(parseInstruction)
      .reduce(
        (acc, instruction) =>
          acc +
          ((instruction.parsed as ParsedSecp256Instruction)?.data
            .numSignatures ?? 0),
        0,
      );

    return {
      ed25519SignaturesCount: ed25519Count,
      secp256k1SignaturesCount: secp256k1Count,
      secp256r1SignaturesCount: secp256r1Count,
      totalSignaturesCount: ed25519Count + secp256k1Count + secp256r1Count,
    };
  }

  /**
   * Normalizes the various input types to a common format.
   * @param input - Transaction message or transaction data.
   * @returns Normalized input.
   */
  static #normalizeInput(input: NormalizableInput): NormalizedInput {
    if (this.#isBase64EncodedTransaction(input)) {
      return normalizeBase64EncodedTransaction(input);
    }

    if (this.#isBase64EncodedTransactionMessage(input)) {
      return normalizeBase64EncodedTransactionMessage(input as string);
    }

    if (this.#isCompiledTransactionMessage(input)) {
      return normalizeCompiledTransactionMessage(input);
    }

    if (this.#isKitTransaction(input)) {
      return normalizeKitTransaction(input);
    }

    if (this.#isSolanaTransaction(input)) {
      return normalizeSolanaTransaction(input);
    }

    throw new FeeCalculatorUnsupportedInputTypeError(
      'The fee calculator could not recognize the input type. It supports SolanaTransactions, kit Transactions, and base64 strings.',
    );
  }

  static #isBase64EncodedTransaction(
    input: NormalizableInput,
  ): input is string {
    try {
      if (typeof input !== 'string') {
        return false;
      }
      normalizeBase64EncodedTransaction(input);
      return true;
    } catch (error) {
      return false;
    }
  }

  static #isBase64EncodedTransactionMessage(
    input: NormalizableInput,
  ): input is string {
    try {
      if (typeof input !== 'string') {
        return false;
      }
      normalizeBase64EncodedTransactionMessage(input);
      return true;
    } catch (error) {
      return false;
    }
  }

  static #isCompiledTransactionMessage(
    input: NormalizableInput,
  ): input is CompiledTransactionMessage {
    return (
      typeof input === 'object' &&
      'instructions' in input &&
      'staticAccounts' in input
    );
  }

  static #isSolanaTransaction(
    input: NormalizableInput,
  ): input is SolanaTransaction {
    return (
      typeof input === 'object' &&
      'transaction' in input &&
      typeof input.transaction === 'object' &&
      'message' in input.transaction &&
      typeof input.transaction.message === 'object' &&
      'accountKeys' in input.transaction.message &&
      typeof input.transaction.message.accountKeys === 'object' &&
      'instructions' in input.transaction.message &&
      typeof input.transaction.message.instructions === 'object' &&
      'signatures' in input.transaction &&
      typeof input.transaction.signatures === 'object'
    );
  }

  static #isKitTransaction(input: NormalizableInput): input is KitTransaction {
    return (
      typeof input === 'object' &&
      'messageBytes' in input &&
      typeof input.messageBytes === 'object' &&
      'signatures' in input
    );
  }
}
