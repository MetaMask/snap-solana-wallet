import type { InstructionParseResult } from '../../../entities';

const TRANSFER_INSTRUCTION_TYPES = new Set([
  'TransferSol',
  'TransferSolWithSeed',
  'Transfer',
  'TransferChecked',
  'TransferCheckedWithFee',
]);

/**
 * Extracts the destination address from parsed transaction instructions
 * by finding the first transfer-type instruction and reading its destination account.
 *
 * @param instructions - The parsed instructions from the transaction.
 * @returns The destination address if found, or null.
 */
export function extractDestinationAddress(
  instructions: InstructionParseResult[],
): string | null {
  for (const instruction of instructions) {
    if (
      !instruction.parsed ||
      !TRANSFER_INSTRUCTION_TYPES.has(instruction.type)
    ) {
      continue;
    }

    const destination = instruction.parsed.accounts?.destination;
    if (destination?.address) {
      return destination.address;
    }
  }

  return null;
}
