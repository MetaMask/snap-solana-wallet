import type {
  Base58EncodedBytes,
  Blockhash,
  Lamports,
  Slot,
  UnixTimestamp,
} from '@solana/kit';
import { address as asAddress } from '@solana/kit';

import type { SolanaTransaction } from '../../../../types/solana';

export const ADDRESS_2_TRANSACTION_3_DATA: SolanaTransaction = {
  blockTime: 1736790801n as UnixTimestamp,
  meta: {
    computeUnitsConsumed: 300n,
    // eslint-disable-next-line id-denylist
    err: null,
    fee: 5000n as Lamports,
    innerInstructions: [],
    loadedAddresses: { readonly: [], writable: [] },
    logMessages: [
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program 11111111111111111111111111111111 invoke [1]',
      'Program 11111111111111111111111111111111 success',
    ],
    postBalances: [2983835040n, 7300935000n, 1n, 1n] as Lamports[],
    postTokenBalances: [],
    preBalances: [3083840040n, 7200935000n, 1n, 1n] as Lamports[],
    preTokenBalances: [],
    rewards: [],
    status: { Ok: null },
  },
  slot: 353869664n as Slot,
  transaction: {
    message: {
      accountKeys: [
        asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        asAddress('FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo'),
        asAddress('11111111111111111111111111111111'),
        asAddress('ComputeBudget111111111111111111111111111111'),
      ],
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
          programIdIndex: 3,
          stackHeight: null,
        },
        {
          accounts: [0, 1],
          data: '3Bxs411Dtc7pkFQj' as Base58EncodedBytes,
          programIdIndex: 2,
          stackHeight: null,
        },
      ],
      recentBlockhash:
        '7pD7SyNQAazBGrP7FBHUbcbgXndk31KN7ZstoJDEa7HP' as Blockhash,
    },
    signatures: ['signature-7'] as Base58EncodedBytes[],
  },
  version: 0,
};
