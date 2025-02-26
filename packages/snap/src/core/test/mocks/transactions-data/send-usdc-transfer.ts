import type {
  Address,
  Base58EncodedBytes,
  Blockhash,
  Lamports,
  StringifiedBigInt,
  StringifiedNumber,
  TransactionVersion,
  UnixTimestamp,
} from '@solana/web3.js';
import { address as asAddress } from '@solana/web3.js';

import type { SolanaTransaction } from '../../../types/solana';

/**
 * Devnet - Send USDC
 * Transaction: 3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV
 *
 * Senders:
 * BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP sends 0.01 USDC
 *
 * Receivers:
 * BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe gets 0.01 USDC
 */
export const EXPECTED_SEND_USDC_TRANSFER_DATA: SolanaTransaction = {
  blockTime: 1736502537n as UnixTimestamp,
  meta: {
    computeUnitsConsumed: 4644n,
    // eslint-disable-next-line id-denylist
    err: null,
    fee: 5000n as Lamports,
    innerInstructions: [],
    loadedAddresses: {
      readonly: [],
      writable: [],
    },
    logMessages: [
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 200000 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    ],
    postBalances: [3283860040n, 2039280n, 2039280n, 934087680n] as Lamports[],
    postTokenBalances: [
      {
        accountIndex: 1,
        mint: asAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
        owner: asAddress('BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe'),
        programId: asAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '70000' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 0.07,
          uiAmountString: '0.07' as StringifiedNumber,
        },
      },
      {
        accountIndex: 2,
        mint: asAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
        owner: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        programId: asAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '7649876' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 7.649876,
          uiAmountString: '7.649876' as StringifiedNumber,
        },
      },
    ],
    preBalances: [3283865040n, 2039280n, 2039280n, 934087680n] as Lamports[],
    preTokenBalances: [
      {
        accountIndex: 1,
        mint: asAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
        owner: asAddress('BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe'),
        programId: asAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '60000' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 0.06,
          uiAmountString: '0.06' as StringifiedNumber,
        },
      },
      {
        accountIndex: 2,
        mint: asAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
        owner: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        programId: asAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '7659876' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 7.659876,
          uiAmountString: '7.659876' as StringifiedNumber,
        },
      },
    ],
    rewards: [],
    status: {
      Ok: null,
    },
  },
  slot: 353107528n,
  transaction: {
    message: {
      accountKeys: [
        'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        '644PJ6UW8e4gQpjKdBVd4MCYasWjSECKjqd2qzdeAJY6',
        'G23tQHsbQuh3yqUBoyXDn3TwqEbbbUHAHEeUSvJaVRtA',
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      ] as Address[],
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
        'B7QWXjTeXd5kPbKc4ASH56f2EPUjLKW4J5CtNL5iS6GW' as Blockhash,
    },
    signatures: [
      '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
    ] as Base58EncodedBytes[],
  },
  version: 0 as TransactionVersion,
};
