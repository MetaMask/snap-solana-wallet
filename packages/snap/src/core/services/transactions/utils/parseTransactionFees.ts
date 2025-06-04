import type { Transaction } from '@metamask/keyring-api';
import BigNumber from 'bignumber.js';

import type { SolanaTransaction } from '../../../domain';
import { LAMPORTS_PER_SOL, Networks, type Network } from '../../../domain';

/**
 * Parses transaction fees from RPC transaction data.
 * @param params - The options object.
 * @param params.scope - The network scope (e.g., Mainnet, Devnet).
 * @param params.transactionData - The raw transaction data containing fee information.
 * @returns The parsed fee information including the fee amount in lamports.
 */
export function parseTransactionFees({
  scope,
  transactionData,
}: {
  scope: Network;
  transactionData: SolanaTransaction;
}): Transaction['fees'] {
  const totalFee = getTransactionTotalFee(transactionData);
  const baseFee = getBaseFee(transactionData);
  const priorityFee = totalFee.minus(baseFee);

  const fees: Transaction['fees'] = [
    {
      type: 'base',
      asset: {
        fungible: true,
        type: Networks[scope].nativeToken.caip19Id,
        unit: Networks[scope].nativeToken.symbol,
        amount: baseFee.toString(),
      },
    },
  ];

  if (priorityFee?.isGreaterThan(0)) {
    fees.push({
      type: 'priority',
      asset: {
        fungible: true,
        type: Networks[scope].nativeToken.caip19Id,
        unit: Networks[scope].nativeToken.symbol,
        amount: priorityFee.toString(),
      },
    });
  }

  return fees;
}

/**
 * Parses the total fee from transaction data.
 * @param transactionData - The raw transaction data.
 * @returns The total fee in lamports.
 */
function getTransactionTotalFee(transactionData: SolanaTransaction): BigNumber {
  const feeLamports = new BigNumber(
    transactionData.meta?.fee?.toString() ?? '0',
  );
  const feeAmount = feeLamports.dividedBy(LAMPORTS_PER_SOL);
  return feeAmount;
}

/**
 * Calculates the base fee for a transaction.
 * @param transactionData - The raw transaction data.
 * @returns The base fee in lamports.
 */
function getBaseFee(transactionData: SolanaTransaction): BigNumber {
  const numberOfSignatures = transactionData.transaction.signatures.length;
  return BigNumber(5000)
    .dividedBy(LAMPORTS_PER_SOL)
    .multipliedBy(numberOfSignatures);
}
