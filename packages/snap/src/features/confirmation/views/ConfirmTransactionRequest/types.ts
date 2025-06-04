import type { SolMethod } from '@metamask/keyring-api';

import type { SpotPrices } from '../../../../core/clients/price-api/types';
import type { Network } from '../../../../core/constants/solana';
import type {
  Preferences,
  SolanaKeyringAccount,
} from '../../../../core/domain';
import type { TransactionScanResult } from '../../../../core/services/transaction-scan/types';
import type { FetchStatus } from '../../../../types';

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
  advanced: {
    shown: boolean;
    instructions: SolanaInstruction[];
  };
};
