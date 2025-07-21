import { enums } from '@metamask/superstruct';

export type Commitment = 'processed' | 'confirmed' | 'finalized';

export const CommitmentStruct = enums(['processed', 'confirmed', 'finalized']);
