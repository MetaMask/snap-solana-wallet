import type {
  Base58EncodedBytes,
  StringifiedBigInt,
  StringifiedNumber,
  TransactionVersion,
  UnixTimestamp,
} from '@solana/kit';
import { address, blockhash, lamports } from '@solana/kit';

import type { SolanaTransaction } from '../../../domain';

/**
 * Devnet - Send USDC to self
 * Transaction: fFSAjDzu7CdhzVUUC7DMKf7xuuVn8cZ8njPnpjkTBMHo4Y43SZto2GDuy123yKDoTieihPfDHvBpysE7Eh9aPmH
 *
 * Senders:
 * BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP sends 1 USDC to self
 *
 * Receivers:
 * BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP receives 1 USDC (self-transfer)
 */
export const EXPECTED_SEND_USDC_TRANSFER_TO_SELF_DATA: SolanaTransaction = {
  blockTime: 1741796354n as UnixTimestamp,
  meta: {
    computeUnitsConsumed: 4524n,
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
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4374 of 4374 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    ],
    postBalances: [
      lamports(2853640269n),
      lamports(2039280n),
      lamports(1n),
      lamports(934087680n),
    ],
    postTokenBalances: [
      {
        accountIndex: 1,
        mint: address('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
        owner: address('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '7606876' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 7.606876,
          uiAmountString: '7.606876' as StringifiedNumber,
        },
      },
    ],
    preBalances: [
      lamports(2853645269n),
      lamports(2039280n),
      lamports(1n),
      lamports(934087680n),
    ],
    preTokenBalances: [
      {
        accountIndex: 1,
        mint: address('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
        owner: address('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '7606876' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 7.606876,
          uiAmountString: '7.606876' as StringifiedNumber,
        },
      },
    ],
    rewards: [],
    status: {
      Ok: null,
    },
  },
  slot: 366862348n,
  transaction: {
    message: {
      accountKeys: [
        address('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        address('G23tQHsbQuh3yqUBoyXDn3TwqEbbbUHAHEeUSvJaVRtA'),
        address('ComputeBudget111111111111111111111111111111'),
        address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
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
          data: 'JVAEwh' as Base58EncodedBytes,
          programIdIndex: 2,
          stackHeight: null,
        },
        {
          accounts: [1, 1, 0],
          data: '3QCwqmHZ4mdq' as Base58EncodedBytes,
          programIdIndex: 3,
          stackHeight: null,
        },
      ],
      recentBlockhash: blockhash(
        'CAV8KMEh8AAacttd6Hdya1DJhDbuztFtdVsz6qHUx7EM',
      ),
    },
    signatures: [
      'fFSAjDzu7CdhzVUUC7DMKf7xuuVn8cZ8njPnpjkTBMHo4Y43SZto2GDuy123yKDoTieihPfDHvBpysE7Eh9aPmH',
    ] as Base58EncodedBytes[],
  },
  version: 0 as TransactionVersion,
};
