import type {
  Address,
  Base58EncodedBytes,
  StringifiedBigInt,
  StringifiedNumber,
  TransactionVersion,
  UnixTimestamp,
} from '@solana/kit';
import { address, blockhash, lamports } from '@solana/kit';

import type { SolanaTransaction } from '../../../domain';

/**
 * Devnet - Send JUP (TransferChecked)
 * Transaction: 4zvFGpqjihSXgHdw6ymHA8hVfyHURNPwASz4FS4c9wADCMSooojx8k42EUuhoDiGGM73SixUcNXafgnuM5dnKHfH
 *
 * Senders:
 * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa sends JUP tokens
 *
 * Receivers:
 * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa receives JUP tokens
 */
export const EXPECTED_SEND_JUP_TRANSFER_CHECKED_DATA: SolanaTransaction = {
  blockTime: 1742387710n as UnixTimestamp,
  meta: {
    computeUnitsConsumed: 6258n,
    // eslint-disable-next-line id-denylist
    err: null,
    fee: lamports(80001n),
    innerInstructions: [],
    loadedAddresses: {
      readonly: [],
      writable: [],
    },
    logMessages: [
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
      'Program log: Instruction: TransferChecked',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 5958 of 7335 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    ],
    postBalances: [
      lamports(45189040n),
      lamports(2039280n),
      lamports(1n),
      lamports(69942826115n),
      lamports(934087680n),
    ],
    postTokenBalances: [
      {
        accountIndex: 1,
        mint: address('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
        owner: address('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '4881197' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 4.881197,
          uiAmountString: '4.881197' as StringifiedNumber,
        },
      },
    ],
    preBalances: [
      lamports(45269041n),
      lamports(2039280n),
      lamports(1n),
      lamports(69942826115n),
      lamports(934087680n),
    ],
    preTokenBalances: [
      {
        accountIndex: 1,
        mint: address('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
        owner: address('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '4881197' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 4.881197,
          uiAmountString: '4.881197' as StringifiedNumber,
        },
      },
    ],
    rewards: [],
    status: {
      Ok: null,
    },
  },
  slot: 327785925n,
  transaction: {
    message: {
      accountKeys: [
        'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
        'BWqMUT5533X8M4DM3AQvFeAQd451urcVQu3zi6uVxWtT',
        'ComputeBudget111111111111111111111111111111',
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      ] as Address[],
      header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 3,
        numRequiredSignatures: 1,
      },
      instructions: [
        {
          accounts: [],
          data: '3pEM3r5AzBLK' as Base58EncodedBytes,
          programIdIndex: 2,
          stackHeight: null,
        },
        {
          accounts: [],
          data: 'KV3niK' as Base58EncodedBytes,
          programIdIndex: 2,
          stackHeight: null,
        },
        {
          accounts: [1, 3, 1, 0, 0],
          data: 'gvPShZQhKrzGM' as Base58EncodedBytes,
          programIdIndex: 4,
          stackHeight: null,
        },
      ],
      recentBlockhash: blockhash(
        '3ocq1uiEiPfqD95hLCaeiyRri5t4bDTsE41FK5PF1fDN',
      ),
    },
    signatures: [
      '4zvFGpqjihSXgHdw6ymHA8hVfyHURNPwASz4FS4c9wADCMSooojx8k42EUuhoDiGGM73SixUcNXafgnuM5dnKHfH',
    ] as Base58EncodedBytes[],
  },
  version: 'legacy' as TransactionVersion,
};
