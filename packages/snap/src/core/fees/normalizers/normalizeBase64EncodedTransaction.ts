import { getBase64Encoder, getTransactionDecoder, pipe } from '@solana/kit';

import { normalizeKitTransaction } from './normalizeKitTransaction';
import type { NormalizedInput } from './types';

export const normalizeBase64EncodedTransaction = (
  base64String: string,
): NormalizedInput =>
  pipe(
    base64String,
    getBase64Encoder().encode,
    getTransactionDecoder().decode, // This gives us a kit Transaction
    normalizeKitTransaction, // So we can re-use the normalizeKitTransaction function
  );
