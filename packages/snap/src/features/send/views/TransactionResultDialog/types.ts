import { type SolanaCaip2Networks } from '../../../../core/constants/solana';

export type TransactionResultDialogContext = {
  scope: SolanaCaip2Networks;
  transactionSuccess: boolean;
  signature: string | null;
  locale: 'en';
};
