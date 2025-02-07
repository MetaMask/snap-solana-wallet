import type { SolMethod } from '@metamask/keyring-api';

import type { SpotPriceResponse } from '../../core/clients/price-api/types';
import type { Network } from '../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../core/services/keyring/Keyring';
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
  tokenPrices: SpotPriceResponse;
  tokenPricesFetchStatus: FetchStatus;
  scan: null;
  advanced: {
    shown: boolean;
    instructions: SolanaInstruction[];
  };
};
