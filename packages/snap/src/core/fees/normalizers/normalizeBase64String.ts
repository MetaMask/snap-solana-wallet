import { getBase64Encoder, getTransactionDecoder, pipe } from '@solana/kit';

import { normalizeKitTransaction } from './normalizeKitTransaction';

export const normalizeBase64String = (base64String: string) =>
  pipe(
    base64String,
    getBase64Encoder().encode,
    getTransactionDecoder().decode, // This gives us a kit Transaction
    normalizeKitTransaction, // So we can re-use the normalizeKitTransaction function
  );
