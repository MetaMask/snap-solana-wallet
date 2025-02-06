import type { Balance, CaipAssetType } from '@metamask/keyring-api';

import type { SpotPrices } from '../../core/clients/price-api/types';
import type { SolanaTokenMetadata } from '../../core/clients/token-metadata-client/types';
import type { Network } from '../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../core/services/keyring/Keyring';
import type { FormFieldError } from '../../core/types/error';
import type { Preferences } from '../../core/types/snap';
import type { LocalizedMessage } from '../../core/utils/i18n';

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

export type SendContext = {
  scope: Network;
  fromAccountId: string;
  amount: string;
  tokenCaipId: CaipAssetType;
  toAddress: string;
  accounts: SolanaKeyringAccount[];
  feeEstimatedInSol: string;
  feePaidInSol: string;
  validation: Partial<Record<SendFormNames, FormFieldError>>;
  currencyType: SendCurrencyType;
  balances: Record<string, Record<CaipAssetType, Balance>>;
  assets: CaipAssetType[];
  tokenPrices: SpotPrices;
  tokenPricesFetchStatus: FetchStatus;
  tokenMetadata: Record<CaipAssetType, SolanaTokenMetadata>;
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
};

/**
 * 'initial' - The initial state, where no data has been fetched yet.
 * 'fetching' - The state where data is being fetched.
 * 'fetched' - The state where data has been fetched successfully.
 * 'error' - The state where an error occurred while fetching data.
 */
export type FetchStatus = 'initial' | 'fetching' | 'fetched' | 'error';
