import type { Address, CompilableTransactionMessage } from '@solana/kit';
import type BigNumber from 'bignumber.js';

import type { Network } from '../../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../../entities';

export type BuildSendTransactionParams = {
  from: SolanaKeyringAccount;
  to: Address;
  /** From the user's point of view, this is the uiAmount! Need to divide this by the multiplier if any to get the raw amount */
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
