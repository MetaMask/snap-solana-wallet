import type {
  Address,
  Base58EncodedBytes,
  Lamports,
  Slot,
  StringifiedBigInt,
  StringifiedNumber,
} from '@solana/kit';
import { blockhash, lamports, type UnixTimestamp } from '@solana/kit';

import type { SolanaTransaction } from '../../../types/solana';

export const EXPECTED_SWAP_SOL_TO_OBRIC_DATA: SolanaTransaction = {
  blockTime: 1748545222n as UnixTimestamp,
  meta: {
    computeUnitsConsumed: 101807n,
    // eslint-disable-next-line id-denylist
    err: null,
    fee: lamports(17129n),
    innerInstructions: [
      {
        index: 2,
        instructions: [
          {
            accounts: [18],
            data: '84eT' as Base58EncodedBytes,
            programIdIndex: 11,
            stackHeight: 2,
          },
          {
            accounts: [0, 2],
            data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL' as Base58EncodedBytes,
            programIdIndex: 4,
            stackHeight: 2,
          },
          {
            accounts: [2],
            data: 'P' as Base58EncodedBytes,
            programIdIndex: 11,
            stackHeight: 2,
          },
          {
            accounts: [2, 18],
            data: '6Q6A46mVa7ntxYLTkQL1uwuXsmxKehnHCxSemuaNkzZYa' as Base58EncodedBytes,
            programIdIndex: 11,
            stackHeight: 2,
          },
        ],
      },
      {
        index: 3,
        instructions: [
          {
            accounts: [14, 9, 5, 12, 13, 2, 1, 15, 16, 19, 0, 11],
            data: '2j6vnwYDURn8yxjpGDgSwCk2TC7zm3ds9vF' as Base58EncodedBytes,
            programIdIndex: 17,
            stackHeight: 2,
          },
          {
            accounts: [1, 13, 0],
            data: '3GVQAnZaHe7Z' as Base58EncodedBytes,
            programIdIndex: 11,
            stackHeight: 3,
          },
          {
            accounts: [12, 2, 14],
            data: '3YCx4dunCXKm' as Base58EncodedBytes,
            programIdIndex: 11,
            stackHeight: 3,
          },
          {
            accounts: [8],
            data: 'QMqFu4fYGGeUEysFnenhAvD866YwW6jMndC6NeFLmgrgSsQrYzqQkLQZLriiyYAHU6DY9CABySGbF8TQvwB3my7Y4x2mCV92TazD1F3CPHC5Lc1t9Sxvsw4uAWevnAMmvZuNDYJ2mVPStyXdQdpeMWPunS72XGr9kntRo29mYiYQRSF' as Base58EncodedBytes,
            programIdIndex: 10,
            stackHeight: 2,
          },
        ],
      },
    ],
    loadedAddresses: {
      readonly: [
        'J4HJYz4p7TRP96WVFky3vh7XryxoFehHjoRySUTeSeXw' as Address,
        'obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y' as Address,
        'So11111111111111111111111111111111111111112' as Address,
        'Sysvar1nstructions1111111111111111111111111' as Address,
      ],
      writable: [
        '86KSdCfcqnJo9TCLFi3zxsJAJzvx9QU7oEPd6Fn5ZPom' as Address,
        '8ofECjHnVGLU4ywyPdK6mFddEqAuXsnrrov8m2zeFhvj' as Address,
        'Fn68NZzCCgZKtYmnAYbkL6w5NNx3TgjW91dGkLA3hsDK' as Address,
        'FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q' as Address,
      ],
    },
    logMessages: [
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
      'Program log: CreateIdempotent',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: GetAccountDataSize',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 115585 compute units',
      'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program 11111111111111111111111111111111 invoke [2]',
      'Program 11111111111111111111111111111111 success',
      'Program log: Initialize the associated token account',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: InitializeImmutableOwner',
      'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 108998 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: InitializeAccount3',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3158 of 105116 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 19315 of 120990 compute units',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]',
      'Program log: Instruction: Route',
      'Program obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y invoke [2]',
      'Program log: Instruction: Swap',
      'Program log: price_x: 1679383',
      'Program log: price_y: 10000',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 49483 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 41962 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program log: YX15 224719444972,123013945942,991250,5903984',
      'Program obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y consumed 66637 of 97183 compute units',
      'Program obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y success',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 184 of 28810 compute units',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 74633 of 101675 compute units',
      'Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 cBZaAAAAAAA=',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
      'Program log: Instruction: CloseAccount',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2915 of 27042 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 24127 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    ],
    postBalances: [
      1538468067n as Lamports,
      2039280n as Lamports,
      0n as Lamports,
      2039280n as Lamports,
      1n as Lamports,
      29900160n as Lamports,
      731913600n as Lamports,
      1n as Lamports,
      1017968n as Lamports,
      8741760n as Lamports,
      1141440n as Lamports,
      934087680n as Lamports,
      224715580269n as Lamports,
      2039280n as Lamports,
      5526241n as Lamports,
      3167032033n as Lamports,
      2561280n as Lamports,
      1141440n as Lamports,
      1045539216193n as Lamports,
      0n as Lamports,
    ],
    postTokenBalances: [
      {
        accountIndex: 1,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '11827324' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 11.827324,
          uiAmountString: '11.827324' as StringifiedNumber,
        },
      },
      {
        accountIndex: 3,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '244533398' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 244.533398,
          uiAmountString: '244.533398' as StringifiedNumber,
        },
      },
      {
        accountIndex: 12,
        mint: 'So11111111111111111111111111111111111111112' as Address,
        owner: 'Fn68NZzCCgZKtYmnAYbkL6w5NNx3TgjW91dGkLA3hsDK' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '224713540988' as StringifiedBigInt,
          decimals: 9,
          uiAmount: 224.713540988,
          uiAmountString: '224.713540988' as StringifiedNumber,
        },
      },
      {
        accountIndex: 13,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: 'Fn68NZzCCgZKtYmnAYbkL6w5NNx3TgjW91dGkLA3hsDK' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '123014937192' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 123014.937192,
          uiAmountString: '123014.937192' as StringifiedNumber,
        },
      },
    ],
    preBalances: [
      1532581212n as Lamports,
      2039280n as Lamports,
      0n as Lamports,
      2039280n as Lamports,
      1n as Lamports,
      29900160n as Lamports,
      731913600n as Lamports,
      1n as Lamports,
      1017968n as Lamports,
      8741760n as Lamports,
      1141440n as Lamports,
      934087680n as Lamports,
      224721484253n as Lamports,
      2039280n as Lamports,
      5526241n as Lamports,
      3167032033n as Lamports,
      2561280n as Lamports,
      1141440n as Lamports,
      1045539216193n as Lamports,
      0n as Lamports,
    ],
    preTokenBalances: [
      {
        accountIndex: 1,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '12827324' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 12.827324,
          uiAmountString: '12.827324' as StringifiedNumber,
        },
      },
      {
        accountIndex: 3,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '244524648' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 244.524648,
          uiAmountString: '244.524648' as StringifiedNumber,
        },
      },
      {
        accountIndex: 12,
        mint: 'So11111111111111111111111111111111111111112' as Address,
        owner: 'Fn68NZzCCgZKtYmnAYbkL6w5NNx3TgjW91dGkLA3hsDK' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '224719444972' as StringifiedBigInt,
          decimals: 9,
          uiAmount: 224.719444972,
          uiAmountString: '224.719444972' as StringifiedNumber,
        },
      },
      {
        accountIndex: 13,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: 'Fn68NZzCCgZKtYmnAYbkL6w5NNx3TgjW91dGkLA3hsDK' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '123013945942' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 123013.945942,
          uiAmountString: '123013.945942' as StringifiedNumber,
        },
      },
    ],
    rewards: [],
    status: {
      Ok: null,
    },
  },
  slot: 343302515n as Slot,
  transaction: {
    message: {
      accountKeys: [
        '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c' as Address,
        'F77xG4vz2CJeMxxAmFW8pvPx2c5Uk75pksr6Wwx6HFhV' as Address,
        'Ffqao4nxSvgaR5kvFz1F718WaxSv6LnNfHuGqFEZ8fzL' as Address,
        'H4FVf2mGfHN26D1CkZ6sJAb6xUhhnW1w9abpaxHnUbUD' as Address,
        '11111111111111111111111111111111' as Address,
        '6YawcNeZ74tRyCv4UfGydYMr7eho7vbUR6ScVffxKAb3' as Address,
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address,
        'ComputeBudget111111111111111111111111111111' as Address,
        'D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf' as Address,
        'GZsNmWKbqhMYtdSkkvMdEyQF9k5mLmP7tTKYWZjcHVPE' as Address,
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' as Address,
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
      ],
      addressTableLookups: [
        {
          accountKey: 'HPLCVFcCMgt6mp5uZLo9u8WnqAe2Yan7Sf285fRmitYP' as Address,
          readableIndexes: [14, 15, 42, 16],
          writableIndexes: [18, 13, 12, 11],
        },
      ],
      header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 8,
        numRequiredSignatures: 1,
      },
      instructions: [
        {
          accounts: [],
          data: '3gJqkocMWaMm' as Base58EncodedBytes,
          programIdIndex: 7,
          stackHeight: null,
        },
        {
          accounts: [],
          data: 'KGo3nf' as Base58EncodedBytes,
          programIdIndex: 7,
          stackHeight: null,
        },
        {
          accounts: [0, 2, 0, 18, 4, 11],
          data: '2' as Base58EncodedBytes,
          programIdIndex: 6,
          stackHeight: null,
        },
        {
          accounts: [
            11, 0, 1, 2, 10, 18, 10, 8, 10, 17, 14, 9, 5, 12, 13, 2, 1, 15, 16,
            19, 0, 11,
          ],
          data: '2jtsaD446yyqqK5qJ4cgMnD16xhu3vMUQSmXDEWJrsxn4RTnsh' as Base58EncodedBytes,
          programIdIndex: 10,
          stackHeight: null,
        },
        {
          accounts: [2, 0, 0],
          data: 'A' as Base58EncodedBytes,
          programIdIndex: 11,
          stackHeight: null,
        },
        {
          accounts: [1, 3, 0],
          data: '3MB7Gffrb7zX' as Base58EncodedBytes,
          programIdIndex: 11,
          stackHeight: null,
        },
      ],
      recentBlockhash: blockhash(
        'FN4BriKgvHGgyzrz1iZ1rv2zfAvogZ9fFbKiwL8b9Eru',
      ),
    },
    signatures: [
      '28rWme56aMyaP8oX18unFeZg65iyDEhjLhvMBpxyFgKcn38P37ZRsssSZoHDCCr5xUfwfpqsVSSBoShLitHQLdrr' as Base58EncodedBytes,
    ],
  },
  version: 0,
};
