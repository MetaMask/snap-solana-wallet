import {
  getBase64Encoder,
  getCompiledTransactionMessageDecoder,
  pipe,
} from '@solana/kit';

import { normalizeCompiledTransactionMessage } from './normalizeCompiledTransactionMessage';
import type { NormalizedInput } from './types';

export const normalizeBase64EncodedTransactionMessage = (
  base64String: string,
): NormalizedInput =>
  pipe(
    base64String,
    getBase64Encoder().encode,
    getCompiledTransactionMessageDecoder().decode,
    normalizeCompiledTransactionMessage,
  );
