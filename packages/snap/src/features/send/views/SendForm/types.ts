import type { Balance, CaipAssetType } from '@metamask/keyring-api';

import type {
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../../../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../../../core/services/keyring';
import type { TokenPrice } from '../../../../core/services/state';
import type { FormFieldError } from '../../../../core/types/error';
import type { FormState } from '../../../../core/types/form';

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

export type StartSendTransactionFlowParams = {
  scope: SolanaCaip2Networks;
  account: string; // INFO: This is an account ID
};

export enum SendCurrency {
  SOL = 'SOL',
  FIAT = 'USD',
}

export type SendContext = {
  scope: SolanaCaip2Networks;
  fromAccountId: string;
  amount: string;
  toAddress: string;
  accounts: SolanaKeyringAccount[];
  fee: string;
  validation: Partial<Record<SendFormNames, FormFieldError>>;
  currencySymbol: SendCurrency;
  balances: Record<CaipAssetType, Balance>;
  tokenPrices: Record<SolanaCaip19Tokens, TokenPrice>;
  locale: 'en';
};

export type SendState = {
  [SendFormNames.Form]: FormState<SendFormNames>;
};
