import type {
  Base58EncodedBytes,
  Blockhash,
  Lamports,
  Slot,
  StringifiedBigInt,
  StringifiedNumber,
  UnixTimestamp,
} from '@solana/kit';
import { address as asAddress } from '@solana/kit';

import type { SolanaTransaction } from '../../../../domain';

export const ADDRESS_1_TRANSACTION_3_DATA: SolanaTransaction = {
  blockTime: 1736940723n as UnixTimestamp,
  meta: {
    computeUnitsConsumed: 4644n,
    // eslint-disable-next-line id-denylist
    err: null,
    fee: 5000n as Lamports,
    innerInstructions: [],
    loadedAddresses: { readonly: [], writable: [] },
    logMessages: [
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 200000 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    ],
    postBalances: [2783815040n, 2039280n, 2039280n, 934087680n] as Lamports[],
    postTokenBalances: [
      {
        accountIndex: 1,
        mint: asAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
        owner: asAddress('BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe'),
        programId: asAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '130000' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 0.13,
          uiAmountString: '0.13' as StringifiedNumber,
        },
      },
      {
        accountIndex: 2,
        mint: asAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
        owner: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        programId: asAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '7609876' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 7.609876,
          uiAmountString: '7.609876' as StringifiedNumber,
        },
      },
    ],
    preBalances: [2783820040n, 2039280n, 2039280n, 934087680n] as Lamports[],
    preTokenBalances: [
      {
        accountIndex: 1,
        mint: asAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
        owner: asAddress('BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe'),
        programId: asAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '120000' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 0.12,
          uiAmountString: '0.12' as StringifiedNumber,
        },
      },
      {
        accountIndex: 2,
        mint: asAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
        owner: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        programId: asAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '7619876' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 7.619876,
          uiAmountString: '7.619876' as StringifiedNumber,
        },
      },
    ],
    rewards: [],
    status: { Ok: null },
  },
  slot: 354263676n as Slot,
  transaction: {
    message: {
      accountKeys: [
        asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        asAddress('644PJ6UW8e4gQpjKdBVd4MCYasWjSECKjqd2qzdeAJY6'),
        asAddress('G23tQHsbQuh3yqUBoyXDn3TwqEbbbUHAHEeUSvJaVRtA'),
        asAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      ],
      addressTableLookups: [],
      header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 1,
        numRequiredSignatures: 1,
      },
      instructions: [
        {
          accounts: [2, 1, 0],
          data: '3GAG5eogvTjV' as Base58EncodedBytes,
          programIdIndex: 3,
          stackHeight: null,
        },
      ],
      recentBlockhash:
        'AHkrNj8Mk9xH64SzQwHYkg1HRmMZL7ZABgvNGDy56A5p' as Blockhash,
    },
    signatures: ['signature-3'] as Base58EncodedBytes[],
  },
  version: 0,
};
