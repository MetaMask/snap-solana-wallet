import {
  blockhash,
  lamports,
  type Address,
  type Base58EncodedBytes,
  type TransactionVersion,
  type UnixTimestamp,
} from '@solana/kit';

import type { SolanaTransaction } from '../../../types/solana';

/**
 * Devnet - Send native SOL to self
 * Transaction: 4Ccb8PaSob6JjsyDnoFJfUpJZDJHTwcjnK7MxiyVeMtPSsBGKuaMHEVL1VsXTKWS4w26tAhbc3T78aNELjfN8Zwb
 *
 * Senders:
 * BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP sends SOL to self
 *
 * Receivers:
 * BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP receives SOL (self-transfer)
 */
export const EXPECTED_NATIVE_SOL_TRANSFER_TO_SELF_DATA: SolanaTransaction = {
  blockTime: 1741791493n as UnixTimestamp,
  meta: {
    computeUnitsConsumed: 300n,
    // eslint-disable-next-line id-denylist
    err: null,
    fee: lamports(5000n),
    innerInstructions: [],
    loadedAddresses: {
      readonly: [],
      writable: [],
    },
    logMessages: [
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program 11111111111111111111111111111111 invoke [1]',
      'Program 11111111111111111111111111111111 success',
    ],
    postBalances: [lamports(2853645269n), lamports(1n), lamports(1n)],
    postTokenBalances: [],
    preBalances: [lamports(2853650269n), lamports(1n), lamports(1n)],
    preTokenBalances: [],
    rewards: [],
    status: {
      Ok: null,
    },
  },
  slot: 366849749n,
  transaction: {
    message: {
      accountKeys: [
        'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        '11111111111111111111111111111111',
        'ComputeBudget111111111111111111111111111111',
      ] as Address[],
      addressTableLookups: [],
      header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 2,
        numRequiredSignatures: 1,
      },
      instructions: [
        {
          accounts: [],
          data: 'FDJTAf' as Base58EncodedBytes,
          programIdIndex: 2,
          stackHeight: null,
        },
        {
          accounts: [0, 0],
          data: '3Bxs411Dtc7pkFQj' as Base58EncodedBytes,
          programIdIndex: 1,
          stackHeight: null,
        },
      ],
      recentBlockhash: blockhash(
        '3JrVnd9x8o81Jd21tu2tuCfuhmce2C8uSfP9R3nPQVuc',
      ),
    },
    signatures: [
      '4Ccb8PaSob6JjsyDnoFJfUpJZDJHTwcjnK7MxiyVeMtPSsBGKuaMHEVL1VsXTKWS4w26tAhbc3T78aNELjfN8Zwb',
    ] as Base58EncodedBytes[],
  },
  version: 0 as TransactionVersion,
};
