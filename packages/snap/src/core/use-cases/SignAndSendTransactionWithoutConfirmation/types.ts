import type { TransactionIntent } from '../../domain';

export type SignAndSendTransactionWithoutConfirmationParams = {
  intent: TransactionIntent;
  transaction: string; // Base64 encoded transaction
  signature: string;
};

export type SignAndSendTransactionWithoutConfirmationResponse = {
  transactionId: string; // Transaction signature
};
