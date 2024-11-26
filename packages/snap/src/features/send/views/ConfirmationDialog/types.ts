import { type SolanaCaip2Networks } from '../../../../core/constants/solana';

export enum TransactionConfirmationNames {
  BackButton = 'transaction-confirmation-back-button',
  CancelButton = 'transaction-confirmation-cancel-button',
  ConfirmButton = 'transaction-confirmation-submit-button',
}

export type TransactionConfirmationContext = {
  scope: SolanaCaip2Networks;

  fromAccountId: string;
  fromAddress: string;
  toAddress: string;

  amount: string;
  fee: string;

  tokenSymbol: string;
  tokenContractAddress: string;
  tokenPrice: string;
};
