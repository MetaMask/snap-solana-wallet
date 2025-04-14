import type {
  Address,
  Base58EncodedBytes,
  StringifiedBigInt,
  StringifiedNumber,
  TransactionVersion,
  UnixTimestamp,
} from '@solana/kit';
import { address, blockhash, lamports } from '@solana/kit';

import type { SolanaTransaction } from '../../../types/solana';

/**
 * Create Associated Token Account
 * Transaction: 4c5dH6XVzPUYtjE9RCQavfyuvPtsdf69N8YqbNSHBnBYze9itnyCKCbRg8jxReyATg2vc81SkMUuG4H5qJB5jHwz
 *
 * Creator:
 * DAXnAudMEqiD1sS1rFn4ds3pdybRYJd9J58PqCncVVqS creates an associated token account
 *
 * Owner:
 * 6X6V7GcxuNt6inqFeyC2fKm7JPAqnZAmUAswc4Q5X7Lz owns the new token account
 *
 * Token:
 * DAXnAudMEqiD1sS1rFn4ds3pdybRYJd9J58PqCncVVqS mint address
 */
export const EXPECTED_CREATE_ASSOCIATED_TOKEN_ACCOUNT_DATA: SolanaTransaction =
  {
    blockTime: 1744359653n as UnixTimestamp,
    meta: {
      computeUnitsConsumed: 20438n,
      // eslint-disable-next-line id-denylist
      err: null,
      fee: lamports(5000n),
      innerInstructions: [
        {
          index: 0,
          instructions: [
            {
              accounts: [4],
              data: '84eT' as Base58EncodedBytes,
              programIdIndex: 6,
              stackHeight: 2,
            },
            {
              accounts: [0, 1],
              data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL' as Base58EncodedBytes,
              programIdIndex: 2,
              stackHeight: 2,
            },
            {
              accounts: [1],
              data: 'P' as Base58EncodedBytes,
              programIdIndex: 6,
              stackHeight: 2,
            },
            {
              accounts: [1, 4],
              data: '6MSWotckh3UQAgRNSUeLKYC4YvknnRnmQrgCVLZXCB2RE' as Base58EncodedBytes,
              programIdIndex: 6,
              stackHeight: 2,
            },
          ],
        },
      ],
      loadedAddresses: {
        readonly: [],
        writable: [],
      },
      logMessages: [
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
        'Program log: Create',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
        'Program log: Instruction: GetAccountDataSize',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 194525 compute units',
        'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program 11111111111111111111111111111111 invoke [2]',
        'Program 11111111111111111111111111111111 success',
        'Program log: Initialize the associated token account',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
        'Program log: Instruction: InitializeImmutableOwner',
        'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 187938 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
        'Program log: Instruction: InitializeAccount3',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4188 of 184054 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 20438 of 200000 compute units',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
      ],
      postBalances: [
        lamports(66979494n),
        lamports(2039280n),
        lamports(1n),
        lamports(731913600n),
        lamports(13997321954n),
        lamports(2274737n),
        lamports(934087680n),
      ],
      postTokenBalances: [
        {
          accountIndex: 1,
          mint: address('J1Wpmugrooj1yMyQKrdZ2vwRXG5rhfx3vTnYE39gpump'),
          owner: address('Jp8xRDtkd8LQwGvPV8z4DdARsCy23Vi9m2dqyqNsszG'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '0' as StringifiedBigInt,
            decimals: 6,
            uiAmount: null,
            uiAmountString: '0' as StringifiedNumber,
          },
        },
      ],
      preBalances: [
        lamports(69023774n),
        lamports(0n),
        lamports(1n),
        lamports(731913600n),
        lamports(13997321954n),
        lamports(2274737n),
        lamports(934087680n),
      ],
      preTokenBalances: [],
      rewards: [],
      status: {
        Ok: null,
      },
    },
    slot: 332720328n,
    transaction: {
      message: {
        accountKeys: [
          'DAXnAudMEqiD1sS1rFn4ds3pdybRYJd9J58PqCncVVqS',
          '6X6V7GcxuNt6inqFeyC2fKm7JPAqnZAmUAswc4Q5X7Lz',
          '11111111111111111111111111111111',
          'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
          'J1Wpmugrooj1yMyQKrdZ2vwRXG5rhfx3vTnYE39gpump',
          'Jp8xRDtkd8LQwGvPV8z4DdARsCy23Vi9m2dqyqNsszG',
          'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        ] as Address[],
        addressTableLookups: [],
        header: {
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 5,
          numRequiredSignatures: 1,
        },
        instructions: [
          {
            accounts: [0, 1, 5, 4, 2, 6],
            data: '1' as Base58EncodedBytes,
            programIdIndex: 3,
            stackHeight: null,
          },
        ],
        recentBlockhash: blockhash(
          '9nmg4bMPr4qiR4NDhqvby1ghpjcaUnyR2CDmgzu4RDJ9',
        ),
      },
      signatures: [
        '4c5dH6XVzPUYtjE9RCQavfyuvPtsdf69N8YqbNSHBnBYze9itnyCKCbRg8jxReyATg2vc81SkMUuG4H5qJB5jHwz',
      ] as Base58EncodedBytes[],
    },
    version: 0 as TransactionVersion,
  };
