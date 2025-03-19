import type { CompilableTransactionMessage } from '@solana/kit';
import {
  compileTransaction,
  getBase64Decoder,
  getTransactionEncoder,
  pipe,
} from '@solana/kit';

export const base64EncodeTransaction = async (
  transactionMessage: CompilableTransactionMessage,
): Promise<string> => {
  const base64EncodedMessage = pipe(
    transactionMessage,
    // Compile transaction.
    compileTransaction,
    // Encode the transaction into a byte array.
    getTransactionEncoder().encode,
    // Encode that byte array as a base64 string.
    getBase64Decoder().decode,
  );

  return base64EncodedMessage;
};
