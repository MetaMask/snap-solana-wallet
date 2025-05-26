import type { Lamports } from '@solana/kit';
import { lamports, pipe } from '@solana/kit';
import BigNumber from 'bignumber.js';

import { MICRO_LAMPORTS_PER_LAMPORTS } from '../../../core/constants/solana';
import type { ISendTransactionBuilder } from './ISendTransactionBuilder';

const BASE_FEE = lamports(5000n);

/**
 * Helper class for calculating the fee for a send transaction.
 */
export class SendFeeCalculator {
  readonly #builder: ISendTransactionBuilder;

  constructor(builder: ISendTransactionBuilder) {
    this.#builder = builder;
  }

  #getPriorityFee(): Lamports {
    const computeUnitLimit = this.#builder.getComputeUnitLimit();
    const computeUnitPriceMicroLamportsPerComputeUnit =
      this.#builder.getComputeUnitPriceMicroLamportsPerComputeUnit();

    return pipe(
      computeUnitLimit,
      (value) => BigNumber(value),
      (value) =>
        value.multipliedBy(
          computeUnitPriceMicroLamportsPerComputeUnit.toString(),
        ),
      (value) =>
        value.dividedToIntegerBy(MICRO_LAMPORTS_PER_LAMPORTS.toString()),
      (value) => value.toString(),
      BigInt,
      lamports,
    );
  }

  getFee(): Lamports {
    const priorityFee = this.#getPriorityFee();
    return lamports(BASE_FEE + priorityFee);
  }
}
