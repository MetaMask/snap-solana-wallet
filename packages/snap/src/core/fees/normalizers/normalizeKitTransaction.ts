import {
  getCompiledTransactionMessageDecoder,
  pipe,
  type Transaction as KitTransaction,
} from '@solana/kit';

import { normalizeCompiledTransactionMessage } from './normalizeCompiledTransactionMessage';
import type { NormalizedInput } from './types';

export const normalizeKitTransaction = (
  input: KitTransaction,
): NormalizedInput => {
  const normalizedTransactionMessage = pipe(
    input.messageBytes,
    getCompiledTransactionMessageDecoder().decode,
    normalizeCompiledTransactionMessage,
  );

  return {
    ...normalizedTransactionMessage,
    // Unlike the compiled transaction message, the transaction actually has ed25519 signatures
    ed25519Signatures: Object.values(input.signatures),
  };
};
