import type { IInstruction, Transaction as KitTransaction } from '@solana/kit';

import type { SolanaTransaction } from '../../types/solana';

export type NormalizableInput = SolanaTransaction | KitTransaction | string;

export type NormalizedInput = {
  ed25519Signatures: readonly any[];
  instructions: readonly IInstruction[];
};

export type Normalizer = (input: NormalizableInput) => NormalizedInput;
