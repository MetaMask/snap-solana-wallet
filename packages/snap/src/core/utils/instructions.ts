/* eslint-disable no-restricted-globals */
import {
  address,
  isInstructionForProgram,
  type CompilableTransactionMessage,
} from '@solana/web3.js';
import bs58 from 'bs58';

import type { SolanaInstruction } from '../../features/confirmation/types';

/**
 * Parses a Solana transaction message into a simplified format.
 * @param instructions - The compilable instructions to parse.
 * @returns The parsed instructions.
 */
export function parseInstructions(
  instructions: CompilableTransactionMessage['instructions'],
) {
  const parsedInstructions: SolanaInstruction[] = [];

  instructions.forEach((instruction) => {
    parsedInstructions.push({
      programId: instruction.programAddress,
      data: bs58.encode(instruction?.data ?? new Uint8Array()),
    });
  });

  return parsedInstructions;
}

/**
 * Truncates the instruction data to 12 characters.
 * @param data - The instruction data to truncate.
 * @returns The truncated instruction data.
 */
export function truncateInstructionData(data: string) {
  if (data.length > 12) {
    return `${data.slice(0, 5)}...${data.slice(-5)}`;
  }

  return data;
}
