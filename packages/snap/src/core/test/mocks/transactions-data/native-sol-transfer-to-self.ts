import type {
  Address,
  Base58EncodedBytes,
  Blockhash,
  Lamports,
  TransactionVersion,
  UnixTimestamp,
} from '@solana/web3.js';

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
    fee: 5000n as Lamports,
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
    postBalances: [2853645269n, 1n, 1n] as Lamports[],
    postTokenBalances: [],
    preBalances: [2853650269n, 1n, 1n] as Lamports[],
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
      recentBlockhash:
        '3JrVnd9x8o81Jd21tu2tuCfuhmce2C8uSfP9R3nPQVuc' as Blockhash,
    },
    signatures: [
      '4Ccb8PaSob6JjsyDnoFJfUpJZDJHTwcjnK7MxiyVeMtPSsBGKuaMHEVL1VsXTKWS4w26tAhbc3T78aNELjfN8Zwb',
    ] as Base58EncodedBytes[],
  },
  version: 0 as TransactionVersion,
};
