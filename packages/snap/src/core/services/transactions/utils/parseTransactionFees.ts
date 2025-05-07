/* eslint-disable no-bitwise */
import type { Transaction } from '@metamask/keyring-api';
import {
  COMPUTE_BUDGET_PROGRAM_ADDRESS,
  SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR,
  SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR,
} from '@solana-program/compute-budget';
import { lamports, type Lamports } from '@solana/kit';
import BigNumber from 'bignumber.js';
import bs58 from 'bs58';

import type { Network } from '../../../constants/solana';
import {
  LAMPORTS_PER_SOL,
  MICRO_LAMPORTS_PER_LAMPORT,
  Networks,
} from '../../../constants/solana';
import type { SolanaTransaction } from '../../../types/solana';

/**
 * Parses transaction fees from RPC transaction data and returns them in the format expected by the keyring API.
 * NOTE: In the returned format, the fee amount is in SOL, as defined by the keyring API.
 *
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.transactionData - The raw transaction data containing fee information.
 * @returns The parsed fee information including the fee amount in SOL.
 */
export function parseTransactionFees({
  scope,
  transactionData,
}: {
  scope: Network;
  transactionData: SolanaTransaction;
}): Transaction['fees'] {
  const totalFeeLamports = getTotalFee(transactionData);
  const totalFeeLamportsBigNumber = new BigNumber(totalFeeLamports.toString());
  const totalFeeMicroLamportsBigNumber = totalFeeLamportsBigNumber.multipliedBy(
    MICRO_LAMPORTS_PER_LAMPORT,
  );

  const priorityFeeMicroLamports = getPriorityFeeMicroLamports(transactionData);
  const priorityFeeMicroLamportsBigNumber = new BigNumber(
    priorityFeeMicroLamports.toString(),
  );
  const priorityFeeSolBigNumber = priorityFeeMicroLamportsBigNumber
    .dividedBy(MICRO_LAMPORTS_PER_LAMPORT)
    .dividedBy(LAMPORTS_PER_SOL);

  const baseFeeMicroLamportsBigNumber = totalFeeMicroLamportsBigNumber.minus(
    priorityFeeMicroLamportsBigNumber,
  );
  const baseFeeSolBigNumber = baseFeeMicroLamportsBigNumber
    .dividedBy(MICRO_LAMPORTS_PER_LAMPORT)
    .dividedBy(LAMPORTS_PER_SOL);

  const fees: Transaction['fees'] = [
    {
      type: 'base',
      asset: {
        fungible: true,
        type: Networks[scope].nativeToken.caip19Id,
        unit: Networks[scope].nativeToken.symbol,
        amount: baseFeeSolBigNumber.toString(),
      },
    },
  ];

  if (priorityFeeSolBigNumber.isGreaterThan(0)) {
    fees.push({
      type: 'priority',
      asset: {
        fungible: true,
        type: Networks[scope].nativeToken.caip19Id,
        unit: Networks[scope].nativeToken.symbol,
        amount: priorityFeeSolBigNumber.toString(),
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
function getTotalFee(transactionData: SolanaTransaction): Lamports {
  return transactionData.meta?.fee ?? lamports(0n);
}

/**
 * Extracts the priority fees in micro-lamports from transaction data.
 * Priority fee = Compute Units Limit * Compute Unit Price.
 *
 * @param transactionData - The raw transaction data.
 * @returns The priority fee in microLamports-lamports.
 */
function getPriorityFeeMicroLamports(
  transactionData: SolanaTransaction,
): bigint {
  const computeBudgetProgramAccountIndex =
    transactionData.transaction.message.accountKeys.findIndex(
      (accountKey) => accountKey === COMPUTE_BUDGET_PROGRAM_ADDRESS,
    );

  if (!computeBudgetProgramAccountIndex) {
    return lamports(0n);
  }

  let computeUnitLimit = null;
  let computeUnitPriceMicroLamportPerCu = null;
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
      if (opcode === SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR) {
        computeUnitLimit = decodeComputeUnitLimit(data);
      }

      if (opcode === SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR) {
        computeUnitPriceMicroLamportPerCu = decodeComputeUnitPrice(data);
      }
    } else {
      nonComputeBudgetProgramInstructions += 1;
    }
  }

  if (!computeUnitPriceMicroLamportPerCu) {
    return lamports(0n);
  }

  if (!computeUnitLimit) {
    computeUnitLimit = BigNumber(200_000).multipliedBy(
      nonComputeBudgetProgramInstructions,
    );
  }

  const computeUnitLimitBigNumber = new BigNumber(computeUnitLimit.toString());
  const computeUnitPriceMicroLamportPerCuBigNumber = new BigNumber(
    computeUnitPriceMicroLamportPerCu.toString(),
  );

  const priorityFeeMicroLamports = BigInt(
    computeUnitPriceMicroLamportPerCuBigNumber
      .multipliedBy(computeUnitLimitBigNumber)
      .toString(),
  );

  return priorityFeeMicroLamports;
}

/**
 * Decodes the Compute Unit Price instruction in microLamports per compute unit.
 *
 * @param data - The data of the instruction.
 * @returns The compute unit price in micro-lamports per compute unit.
 */
function decodeComputeUnitPrice(data: Uint8Array): bigint {
  /**
   * setComputeUnitPrice instruction has a fixed length of 9 bytes.
   * opcode (1 byte) + cuPriceInMicroLamportPerCu (8 bytes)
   */
  let computeUnitPriceInMicroLamportPerCu = BigInt(0);
  for (let i = 0; i < 8; i++) {
    computeUnitPriceInMicroLamportPerCu |=
      BigInt(data[1 + i] ?? 0) << BigInt(8 * i);
  }

  return computeUnitPriceInMicroLamportPerCu;
}

/**
 * Decodes the Compute Unit Limit instruction.
 * @param data - The data of the instruction.
 * @returns The compute unit limit.
 */
function decodeComputeUnitLimit(data: Uint8Array): bigint {
  /**
   * setComputeUnitLimit instruction has a fixed length of 5 bytes.
   * opcode (1 byte) + computeUnitLimit (4 bytes)
   */
  let raw = BigInt(0);
  for (let i = 0; i < 4; i++) {
    // eslint-disable-next-line no-bitwise
    raw |= BigInt(data[1 + i] ?? 0) << BigInt(8 * i);
  }

  return raw;
}
