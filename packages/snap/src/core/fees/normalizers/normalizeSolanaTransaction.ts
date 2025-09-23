import { toIInstruction } from '../../../entities';
import type { SolanaTransaction } from '../../types/solana';
import type { NormalizedInput } from './types';

export const normalizeSolanaTransaction = (
  input: SolanaTransaction,
): NormalizedInput => {
  return {
    ed25519Signatures: input.transaction.signatures,
    instructions: input.transaction.message.instructions.map((instruction) =>
      toIInstruction(instruction, input),
    ),
  };
};
