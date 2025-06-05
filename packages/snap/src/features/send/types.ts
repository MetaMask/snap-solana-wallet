import type { Balance, CaipAssetType } from '@metamask/keyring-api';

import type { SpotPrices } from '../../core/clients/price-api/types';
import type {
  Network,
  Preferences,
  SolanaKeyringAccount,
} from '../../core/domain';
import type { LocalizedMessage } from '../../core/utils/i18n';
import type { FetchStatus } from '../../types';

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
  AssetSelector = 'send-asset-selector',
  SwapCurrencyButton = 'send-swap-currency',
  MaxAmountButton = 'send-amount-input-max',
  CancelButton = 'send-cancel-button',
  SendButton = 'send-submit-button',
  ClearButton = 'send-clear-button',
  CloseButton = 'send-close-button',
}

export enum SendCurrencyType {
  TOKEN = 'TOKEN',
  FIAT = 'USD',
}

export type SendTransation = {
  result: 'success' | 'failure';
  signature: string | null;
};

export type SendTokenMetadata = {
  symbol: string;
  name: string;
  asset: CaipAssetType;
  imageSvg: string | null;
};

export type SendContext = {
  scope: Network;
  fromAccountId: string;
  amount: string | null;
  tokenCaipId: CaipAssetType;
  toAddress: string | null;
  accounts: SolanaKeyringAccount[];
  feeEstimatedInSol: string | null;
  feePaidInSol: string | null;
  validation: Partial<Record<SendFormNames, FormFieldError>>;
  currencyType: SendCurrencyType;
  balances: Record<string, Record<CaipAssetType, Balance>>;
  assets: CaipAssetType[];
  tokenPrices: SpotPrices;
  tokenPricesFetchStatus: FetchStatus;
  selectedTokenMetadata: SendTokenMetadata | null;
  transaction: SendTransation | null;
  buildingTransaction: boolean;
  transactionMessage: string | null;
  stage: SendFlowStage;
  preferences: Preferences;
  error: {
    title: LocalizedMessage;
    message: LocalizedMessage;
    link?: string;
  } | null;
  minimumBalanceForRentExemptionSol: string;
  loading: boolean;
};

export type FormFieldError<Field = string> = {
  message: string;
  value: Field;
} | null;

export type FormState<FormNames extends string | number | symbol> = Record<
  FormNames,
  string | number | boolean | null
>;

export type FieldValidationFunction = (value: string) => FormFieldError;
export type ValidationFunction = (
  message: LocalizedMessage,
  value?: any,
) => FieldValidationFunction;
