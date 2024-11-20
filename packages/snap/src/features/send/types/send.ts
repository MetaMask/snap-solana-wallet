import type { SolanaCaip2Networks } from '../../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../../core/services/keyring';
import type { FormFieldError } from '../../../core/types/error';
import type { FormState } from '../../../core/types/form';
import type { SendFormNames } from './form';

export type StartSendTransactionFlowParams = {
  scope: SolanaCaip2Networks;
  account: string; // INFO: This is an account ID
};

export type SendContext = {
  scope: SolanaCaip2Networks;
  selectedAccountId: string;
  accounts: SolanaKeyringAccount[];
  validation: Partial<Record<SendFormNames, FormFieldError>>;
  clearToField: boolean;
};

export type SendState = {
  [SendFormNames.Form]: FormState<SendFormNames>;
};
