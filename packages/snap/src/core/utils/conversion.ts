import BigNumber from 'bignumber.js';

import { LAMPORTS_PER_SOL } from '../domain';

/**
 * Converts lamports to SOL.
 *
 * @param amountInLamports - The amount of lamports to convert.
 * @returns The amount of SOL.
 */
export const lamportsToSol = (
  amountInLamports: string | number | bigint | BigNumber,
): BigNumber => {
  return BigNumber(amountInLamports.toString()).dividedBy(LAMPORTS_PER_SOL);
};

/**
 * Converts SOL to lamports.
 *
 * @param amountInSol - The amount of SOL to convert.
 * @returns The amount of lamports.
 */
export const solToLamports = (
  amountInSol: string | number | bigint | BigNumber,
): BigNumber => {
  return BigNumber(amountInSol.toString())
    .multipliedBy(LAMPORTS_PER_SOL)
    .integerValue(BigNumber.ROUND_DOWN);
};
