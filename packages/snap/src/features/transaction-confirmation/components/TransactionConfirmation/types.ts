import { type SolanaCaip2Networks } from '../../../../core/constants/solana';

export type TransactionConfirmationParams = {
  scope: SolanaCaip2Networks;

  fromAccountId: string;
  toAddress: string;

  amount: string;
  fee: string;

  tokenSymbol: string;
  tokenContractAddress: string;
  tokenPrice: number;
};

export enum TransactionConfirmationNames {
  BackButton = 'transaction-confirmation-back-button',
  Cancel = 'transaction-confirmation-cancel-button',
  Confirm = 'transaction-confirmation-submit-button',
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
  tokenPrice: number;
};
