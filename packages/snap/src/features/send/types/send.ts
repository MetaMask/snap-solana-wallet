import type { Balance, CaipAssetType } from '@metamask/keyring-api';

import type { SolanaCaip2Networks } from '../../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../../core/services/keyring';
import type { TokenRate } from '../../../core/services/state';
import type { FormFieldError } from '../../../core/types/error';
import type { FormState } from '../../../core/types/form';
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
  tokenRate: TokenRate;
  maxBalance: boolean;
  canReview: boolean;
};

export type SendState = {
  [SendFormNames.Form]: FormState<SendFormNames>;
};
