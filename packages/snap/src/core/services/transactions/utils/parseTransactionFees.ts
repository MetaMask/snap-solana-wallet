import type { Transaction } from '@metamask/keyring-api';
import BigNumber from 'bignumber.js';
import bs58 from 'bs58';

import type { Network } from '../../../constants/solana';
import { LAMPORTS_PER_SOL, Networks } from '../../../constants/solana';
import type { SolanaTransaction } from '../../../types/solana';

/**
 * Parses transaction fees from RPC transaction data.
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.transactionData - The raw transaction data containing fee information.
 * @returns The parsed fee information including the fee amount in lamports.
 */
export function parseTransactionFees({
  scope,
  transactionData,
}: {
  scope: Network;
  transactionData: SolanaTransaction;
}): Transaction['fees'] {
  const totalFee = getTransactionTotalFee(transactionData);
  const priorityFee = getTransactionPriorityFee(transactionData);
  const baseFee = totalFee.minus(priorityFee ?? 0);

  const fees: Transaction['fees'] = [
    {
      type: 'base',
      asset: {
        fungible: true,
        type: Networks[scope].nativeToken.caip19Id,
        unit: Networks[scope].nativeToken.symbol,
        amount: baseFee.toString(),
      },
    },
  ];

  if (priorityFee?.isGreaterThan(0)) {
    fees.push({
      type: 'priority',
      asset: {
        fungible: true,
        type: Networks[scope].nativeToken.caip19Id,
        unit: Networks[scope].nativeToken.symbol,
        amount: priorityFee.toString(),
      },
    });
  }

  return fees;
}

/**
 * Parses the total fee from transaction data.
 * @param transactionData - The raw transaction data.
 * @returns The total fee in lamports.
 */
function getTransactionTotalFee(transactionData: SolanaTransaction): BigNumber {
  const feeLamports = new BigNumber(
    transactionData.meta?.fee?.toString() ?? '0',
  );
  const feeAmount = feeLamports.dividedBy(LAMPORTS_PER_SOL);
  return feeAmount;
}

/**
 * Parses priority fee from transaction data.
 * Priority fee = Compute Units Limit * Compute Unit Price.
 *
 * @param transactionData - The raw transaction data.
 * @returns The priority fee in lamports.
 */
function getTransactionPriorityFee(
  transactionData: SolanaTransaction,
): BigNumber | null {
  const computeBudgetProgramAccountIndex =
    transactionData.transaction.message.accountKeys.findIndex(
      (accountKey) =>
        accountKey === 'ComputeBudget111111111111111111111111111111',
    );

  if (!computeBudgetProgramAccountIndex) {
    return null;
  }

  let computeUnitLimit = null;
  let computeUnitPrice = null;
  let nonComputeBudgetProgramInstructions = 0;

  for (const instruction of transactionData.transaction.message.instructions) {
    if (instruction.programIdIndex === computeBudgetProgramAccountIndex) {
      const data = bs58.decode(instruction.data);
      const opcode = data[0];

      /**
       * Opcodes:
       * setComputeUnitLimit instruction is 2. Value is the next 4 bytes.
       * setComputeUnitPrice instruction is 3. Value is the next 8 bytes.
       */
      if (opcode === 2) {
        computeUnitLimit = decodeComputeUnitLimit(data);
      }

      if (opcode === 3) {
        computeUnitPrice = decodeComputeUnitPrice(data);
      }
    } else {
      nonComputeBudgetProgramInstructions += 1;
    }
  }

  if (!computeUnitPrice) {
    return null;
  }

  if (!computeUnitLimit) {
    computeUnitLimit = BigNumber(200_000).multipliedBy(
      nonComputeBudgetProgramInstructions,
    );
  }

  const priorityFee = computeUnitPrice
    .multipliedBy(computeUnitLimit)
    .dividedBy(LAMPORTS_PER_SOL)
    .decimalPlaces(9, BigNumber.ROUND_HALF_UP);

  return priorityFee;
}

/**
 * Decodes the Compute Unit Price instruction returning the value in lamports.
 *
 * @param data - The data of the instruction.
 * @returns The compute unit price in lamports.
 */
function decodeComputeUnitPrice(data: Uint8Array) {
  /**
   * setComputeUnitPrice instruction has a fixed length of 9 bytes.
   * opcode (1 byte) + computeUnitPriceMicroLamports (8 bytes)
   */
  let raw = BigInt(0);
  for (let i = 0; i < 8; i++) {
    // eslint-disable-next-line no-bitwise
    raw |= BigInt(data[1 + i] ?? 0) << BigInt(8 * i);
  }

  return BigNumber(raw.toString()).dividedBy(1e6);
}

/**
 * Decodes the Compute Unit Limit instruction.
 * @param data - The data of the instruction.
 * @returns The compute unit limit.
 */
function decodeComputeUnitLimit(data: Uint8Array) {
  /**
   * setComputeUnitLimit instruction has a fixed length of 5 bytes.
   * opcode (1 byte) + computeUnitLimit (4 bytes)
   */
  let raw = BigInt(0);
  for (let i = 0; i < 4; i++) {
    // eslint-disable-next-line no-bitwise
    raw |= BigInt(data[1 + i] ?? 0) << BigInt(8 * i);
  }

  return BigNumber(raw.toString());
}
