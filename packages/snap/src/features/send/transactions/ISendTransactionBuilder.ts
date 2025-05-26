import type { Address, CompilableTransactionMessage } from '@solana/kit';
import type BigNumber from 'bignumber.js';

import type { Network } from '../../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../../core/handlers/onKeyringRequest/Keyring';

export type BuildSendTransactionParams = {
  from: SolanaKeyringAccount;
  to: Address;
  amount: string | number | bigint | BigNumber;
  network: Network;
  mint?: Address;
};

/**
 * A class that builds transactions for the Send flow.
 */
export type ISendTransactionBuilder = {
  buildTransactionMessage(
    params: BuildSendTransactionParams,
  ): Promise<CompilableTransactionMessage>;
  getComputeUnitLimit(): number;
  getComputeUnitPriceMicroLamportsPerComputeUnit(): bigint;
};
