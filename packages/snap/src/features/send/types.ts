import type { Balance, CaipAssetType } from '@metamask/keyring-api';

import type {
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../core/services/keyring';
import type { TokenPrice } from '../../core/services/state';
import type { FormFieldError } from '../../core/types/error';
import type { Preferences } from '../../core/types/snap';

export type SendFlowStage =
  | 'send-form'
  | 'transaction-confirmation'
  | 'send-pending'
  | 'transaction-success'
  | 'transaction-failure';

export enum SendFormNames {
  Form = 'send-form',
  DestinationAccountInput = 'send-to',
  BackButton = 'send-back-button',
  SourceAccountSelector = 'send-account-selector',
  AmountInput = 'send-amount-input',
  SwapCurrencyButton = 'send-swap-currency',
  MaxAmountButton = 'send-amount-input-max',
  CancelButton = 'send-cancel-button',
  SendButton = 'send-submit-button',
  ClearButton = 'send-clear-button',
  CloseButton = 'send-close-button',
}

export enum SendCurrency {
  SOL = 'SOL',
  FIAT = 'USD',
}

export type SendTransation = {
  result: 'success' | 'failure';
  signature: string | null;
  tokenPrice: TokenPrice | null;
};

export type SendContext = {
  scope: SolanaCaip2Networks;
  fromAccountId: string;
  amount: string;
  toAddress: string;
  accounts: SolanaKeyringAccount[];
  feeInSol: string;
  validation: Partial<Record<SendFormNames, FormFieldError>>;
  currencySymbol: SendCurrency;
  balances: Record<CaipAssetType, Balance>;
  tokenPrices: Record<SolanaCaip19Tokens, TokenPrice>;
  transaction: SendTransation | null;
  stage: SendFlowStage;
  preferences: Preferences;
};
