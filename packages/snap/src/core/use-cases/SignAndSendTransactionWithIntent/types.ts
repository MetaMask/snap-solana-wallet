import type { TransactionIntent } from '../../domain';

export type SignAndSendTransactionWithIntentParams = {
  intent: TransactionIntent;
  transaction: string; // Base64 encoded transaction
  signature: string;
};

export type SignAndSendTransactionWithIntentResponse = {
  transactionId: string; // Transaction signature
};
