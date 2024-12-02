import type { Balance, CaipAssetType } from '@metamask/keyring-api';
import type { GetCurrencyRateResult } from '@metamask/snaps-sdk';

import type { SolanaCaip2Networks } from '../../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../../core/services/keyring';
import type { FormFieldError } from '../../../core/types/error';
import type { FormState } from '../../../core/types/form';
import type { Locale } from '../../../core/utils/i18n';
import type { SendFormNames } from './form';

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
  selectedAccountId: string;
  accounts: SolanaKeyringAccount[];
  validation: Partial<Record<SendFormNames, FormFieldError>>;
  clearToField: boolean;
  showClearButton: boolean;
  currencySymbol: SendCurrency;
  balances: Record<CaipAssetType, Balance>;
  rates: GetCurrencyRateResult;
  maxBalance: boolean;
  canReview: boolean;
  locale: Locale;
};

export type SendState = {
  [SendFormNames.Form]: FormState<SendFormNames>;
};
