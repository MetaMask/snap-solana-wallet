import type { Base58EncodedBytes } from '@solana/kit';

export type SolanaInstruction = {
  accounts: readonly number[];
  data: Base58EncodedBytes;
  programIdIndex: number;
  stackHeight?: number | null;
};
