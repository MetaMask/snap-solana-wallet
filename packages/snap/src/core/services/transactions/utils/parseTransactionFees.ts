import type { Transaction } from '@metamask/keyring-api';
import BigNumber from 'bignumber.js';

import type { Network } from '../../../constants/solana';
import { LAMPORTS_PER_SOL, Networks } from '../../../constants/solana';
import type { SolanaTransaction } from '../../../types/solana';

/**
 * Parses transaction fees from RPC transaction data.
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.transactionData - The raw transaction data containing fee information.
 * @returns The parsed fee information including the fee amount in lamports.
 */
export function parseTransactionFees({
  scope,
  transactionData,
}: {
  scope: Network;
  transactionData: SolanaTransaction;
}): Transaction['fees'] {
  const feeLamports = new BigNumber(
    transactionData.meta?.fee?.toString() ?? '0',
  );
  const feeAmount = feeLamports.dividedBy(LAMPORTS_PER_SOL);

  const fees: Transaction['fees'] = [
    {
      type: 'base',
      asset: {
        fungible: true,
        type: Networks[scope].nativeToken.caip19Id,
        unit: Networks[scope].nativeToken.symbol,
        amount: feeAmount.toString(),
      },
    },
  ];

  // TODO: How can we parse priority fees here?

  return fees;
}
