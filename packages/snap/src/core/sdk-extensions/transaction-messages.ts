import type {
  SetComputeUnitLimitInput,
  SetComputeUnitPriceInput,
} from '@solana-program/compute-budget';
import {
  COMPUTE_BUDGET_PROGRAM_ADDRESS,
  ComputeBudgetInstruction,
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
  identifyComputeBudgetInstruction,
} from '@solana-program/compute-budget';
import type {
  Address,
  BaseTransactionMessage,
  CompilableTransactionMessage,
  IInstruction,
  ITransactionMessageWithFeePayer,
  Rpc,
  SimulateTransactionApi,
  TransactionMessageWithBlockhashLifetime,
} from '@solana/kit';
import {
  getComputeUnitEstimateForTransactionMessageFactory,
  isSolanaError,
  isTransactionMessageWithBlockhashLifetime,
  prependTransactionMessageInstructions,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
} from '@solana/kit';
import { cloneDeep } from 'lodash';

/**
 * Check if the transaction message has a fee payer.
 *
 * @param transactionMessage - The transaction message to check.
 * @returns `true` if the transaction message has a fee payer, `false` otherwise.
 */
export const isTransactionMessageWithFeePayer = <
  TTransactionMessage extends BaseTransactionMessage &
    Partial<ITransactionMessageWithFeePayer>,
>(
  transactionMessage: TTransactionMessage,
): transactionMessage is TTransactionMessage &
  ITransactionMessageWithFeePayer => Boolean(transactionMessage.feePayer);

/**
 * Set the fee payer for the transaction message if it is missing.
 *
 * @param feePayer - The fee payer to set.
 * @param transactionMessage - The transaction message to set the fee payer for.
 * @returns The transaction message with the fee payer set.
 */
export const setTransactionMessageFeePayerIfMissing = <
  TFeePayerAddress extends string,
  TTransactionMessage extends BaseTransactionMessage &
    Partial<ITransactionMessageWithFeePayer>,
>(
  feePayer: Address<TFeePayerAddress>,
  transactionMessage: TTransactionMessage,
) =>
  isTransactionMessageWithFeePayer(transactionMessage)
    ? transactionMessage
    : setTransactionMessageFeePayer(feePayer, transactionMessage);

/**
 * Set the lifetime constraint for the transaction message if it is missing.
 *
 * @param blockhashLifetimeConstraint - The blockhash lifetime constraint to set.
 * @param transaction - The transaction message to set the lifetime constraint for.
 * @returns The transaction message with the lifetime constraint set.
 */
export const setTransactionMessageLifetimeUsingBlockhashIfMissing = <
  TTransaction extends
    | BaseTransactionMessage
    | (BaseTransactionMessage & TransactionMessageWithBlockhashLifetime),
>(
  blockhashLifetimeConstraint: TransactionMessageWithBlockhashLifetime['lifetimeConstraint'],
  transaction: TTransaction,
) =>
  isTransactionMessageWithBlockhashLifetime(transaction)
    ? transaction
    : setTransactionMessageLifetimeUsingBlockhash(
        blockhashLifetimeConstraint,
        transaction,
      );

/**
 * Get a predicate function that checks if an instruction is a compute unit price instruction.
 *
 * @param instruction - The instruction to check.
 * @returns A predicate function that checks if an instruction is a compute unit price instruction.
 */
export const isComputeUnitPriceInstruction = (instruction: IInstruction) =>
  instruction.programAddress === COMPUTE_BUDGET_PROGRAM_ADDRESS &&
  identifyComputeBudgetInstruction({
    data: new Uint8Array(), // Provide a default value for instruction.data it can be undefined
    ...instruction,
  }) === ComputeBudgetInstruction.SetComputeUnitPrice;

/**
 * Check if the transaction message has a compute unit price instruction.
 *
 * @param transaction - The transaction message to check.
 * @returns `true` if the transaction message has a compute unit price instruction, `false` otherwise.
 */
export const isTransactionMessageWithComputeUnitPriceInstruction = <
  TTransaction extends BaseTransactionMessage,
>(
  transaction: TTransaction,
): boolean =>
  transaction.instructions.filter(Boolean).some(isComputeUnitPriceInstruction);

/**
 * Add a compute unit price instruction to the transaction message if it is missing.
 *
 * @param transaction - The transaction message to add the compute unit price instruction to.
 * @param input - The input for the compute unit price instruction.
 * @param config - Optional config for the compute unit price instruction.
 * @param config.programAddress - The program address to check for the compute unit price instruction.
 * @returns The transaction message with the compute unit price instruction added.
 */
export const setComputeUnitPriceInstructionIfMissing = <
  TTransaction extends BaseTransactionMessage,
>(
  transaction: TTransaction,
  input: SetComputeUnitPriceInput,
  config?: {
    programAddress?: Address;
  },
): TTransaction => {
  if (isTransactionMessageWithComputeUnitPriceInstruction(transaction)) {
    return transaction;
  }
  return prependTransactionMessageInstructions(
    [getSetComputeUnitPriceInstruction(input, config)],
    transaction,
  );
};

/**
 * Get a predicate function that checks if an instruction is a compute unit limit instruction.
 *
 * @param instruction - The instruction to check.
 * @returns A predicate function that checks if an instruction is a compute unit limit instruction.
 */
export const isComputeUnitLimitInstruction = (instruction: IInstruction) =>
  instruction.programAddress === COMPUTE_BUDGET_PROGRAM_ADDRESS &&
  identifyComputeBudgetInstruction({
    data: new Uint8Array(), // Provide a default value for instruction.data it can be undefined
    ...instruction,
  }) === ComputeBudgetInstruction.SetComputeUnitLimit;

/**
 * Check if the transaction message has a compute unit limit instruction.
 *
 * @param transaction - The transaction message to check.
 * @returns `true` if the transaction message has a compute unit limit instruction, `false` otherwise.
 */
export const isTransactionMessageWithComputeUnitLimitInstruction = <
  TTransaction extends BaseTransactionMessage,
>(
  transaction: TTransaction,
): boolean =>
  transaction.instructions.filter(Boolean).some(isComputeUnitLimitInstruction);

/**
 * Add a compute unit limit instruction to the transaction message if it is missing.
 *
 * @param transaction - The transaction message to add the compute unit limit instruction to.
 * @param input - The input for the compute unit limit instruction.
 * @param config - Optional config for the compute unit limit instruction.
 * @param config.programAddress - The program address to check for the compute unit limit instruction.
 * @returns The transaction message with the compute unit limit instruction added.
 */
export const setComputeUnitLimitInstructionIfMissing = <
  TTransaction extends BaseTransactionMessage,
>(
  transaction: TTransaction,
  input: SetComputeUnitLimitInput,
  config?: {
    programAddress?: Address;
  },
): TTransaction => {
  if (isTransactionMessageWithComputeUnitLimitInstruction(transaction)) {
    return transaction;
  }
  return prependTransactionMessageInstructions(
    [getSetComputeUnitLimitInstruction({ units: input.units }, config)],
    transaction,
  );
};

/**
 * Estimate the compute unit limit for the transaction message and set it,
 * overriding the existing compute unit limit instruction.
 *
 * If the estimate fails, return the original transaction message unchanged.
 *
 * @param transactionMessage - The transaction message to estimate the compute unit limit for.
 * @param rpc - The RPC to use to estimate the compute unit limit.
 * @param config - Optional config for the compute unit limit instruction.
 * @param config.programAddress - The program address to check for the compute unit limit instruction.
 * @returns The transaction message with the compute unit limit instruction added.
 */
export const estimateAndOverrideComputeUnitLimit = async (
  transactionMessage: CompilableTransactionMessage,
  rpc: Rpc<SimulateTransactionApi>,
  config?: {
    programAddress?: Address;
  },
): Promise<CompilableTransactionMessage> => {
  try {
    const instructions = transactionMessage.instructions.filter(Boolean);

    const getComputeUnitEstimate =
      getComputeUnitEstimateForTransactionMessageFactory({
        rpc,
      });

    const units = await getComputeUnitEstimate(transactionMessage).catch(
      (error) => {
        // If the transaction simulation failed, we recover the units consumed from the error, and consider that as the compute unit limit.
        if (
          isSolanaError(
            error,
            SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
          )
        ) {
          return error.context.unitsConsumed;
        }

        // Otherwise it's an unexpected error. Rethrow.
        throw error;
      },
    );

    // Recreate the transaction message, replacing the compute unit limit instruction with the new one.
    return {
      ...cloneDeep(transactionMessage),
      instructions: [
        ...instructions.filter(
          (instruction) => !isComputeUnitLimitInstruction(instruction),
        ),
        getSetComputeUnitLimitInstruction({ units }, config),
      ],
    } as CompilableTransactionMessage;
  } catch (error) {
    // If the estimate fails, return the original transaction message unchanged.
    return transactionMessage;
  }
};
