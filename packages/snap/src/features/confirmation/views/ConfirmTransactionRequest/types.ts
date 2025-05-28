import type { SolMethod } from '@metamask/keyring-api';

import type { SpotPrices } from '../../../../core/clients/price-api/types';
import type { Network } from '../../../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../../../core/handlers/onKeyringRequest/Keyring';
import type { TransactionScanResult } from '../../../../core/services/transaction-scan/types';
import type { FetchStatus, Preferences } from '../../../../core/types/snap';

export type SolanaInstruction = {
  programId: string;
  data: string;
};

export type ConfirmTransactionRequestContext = {
  method: SolMethod;
  scope: Network;
  networkImage: string | null;
  account: SolanaKeyringAccount | null;
  preferences: Preferences;
  transaction: string;
  feeEstimatedInSol: string | null;
  tokenPrices: SpotPrices;
  tokenPricesFetchStatus: FetchStatus;
  scan: TransactionScanResult | null;
  scanFetchStatus: FetchStatus;
  origin: string;
  advanced: {
    shown: boolean;
    instructions: SolanaInstruction[];
  };
};
