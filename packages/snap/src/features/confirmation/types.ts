import type { CaipAssetType, SolMethod } from '@metamask/keyring-api';

import type { SpotPrices } from '../../core/clients/price-api/types';
import type { Network } from '../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../core/handlers/onKeyringRequest/Keyring';
import type { TransactionScanResult } from '../../core/services/transaction-scan/types';
import type { FetchStatus, Preferences } from '../../core/types/snap';

export enum ConfirmationFormNames {
  ShowAdvanced = 'confirmation-show-advanced',
  Cancel = 'confirmation-cancel',
  Confirm = 'confirmation-confirm',
}

export type SolanaInstruction = {
  programId: string;
  data: string;
};

export type ConfirmationContext = {
  method: SolMethod;
  scope: Network;
  account: SolanaKeyringAccount | null;
  preferences: Preferences;
  transaction: string;
  feeEstimatedInSol: string | null;
  tokenPrices: SpotPrices;
  tokenPricesFetchStatus: FetchStatus;
  scan: TransactionScanResult | null;
  scanFetchStatus: FetchStatus;
  assetsImages: Record<CaipAssetType, string>;
  advanced: {
    shown: boolean;
    instructions: SolanaInstruction[];
  };
};
