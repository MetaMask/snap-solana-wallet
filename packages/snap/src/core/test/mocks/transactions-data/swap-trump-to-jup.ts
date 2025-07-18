import type {
  Base58EncodedBytes,
  Base64EncodedDataResponse,
  Slot,
  TokenBalance,
  TransactionError,
  TransactionVersion,
  UnixTimestamp,
} from '@solana/kit';
import { address, blockhash, lamports } from '@solana/kit';

import type { SolanaTransaction } from '../../../types/solana';

// This structure is based on the getTransaction RPC response,
// so the SolanaTransaction is nested under the "result" property.
export const RPC_RESPONSE_SWAP_TRUMP_TO_JUP_DATA = {
  jsonrpc: '2.0',
  result: {
    blockTime: 1746657467n as UnixTimestamp,
    meta: {
      computeUnitsConsumed: 310639n,
      // eslint-disable-next-line id-denylist
      err: null as TransactionError | null,
      fee: lamports(41876n),
      innerInstructions: [
        {
          index: 7,
          instructions: [
            {
              accounts: [38],
              data: '84eT' as Base58EncodedBytes,
              programIdIndex: 23,
              stackHeight: 2,
            },
            {
              accounts: [0, 2],
              data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL' as Base58EncodedBytes,
              programIdIndex: 9,
              stackHeight: 2,
            },
            {
              accounts: [2],
              data: 'P' as Base58EncodedBytes,
              programIdIndex: 23,
              stackHeight: 2,
            },
            {
              accounts: [2, 38],
              data: '6UcuLLpKgADaq3hvjtNRFUmm68rGNvhDLndvTpArJooK3' as Base58EncodedBytes,
              programIdIndex: 23,
              stackHeight: 2,
            },
          ],
        },
        {
          index: 8,
          instructions: [
            {
              accounts: [4, 8, 0],
              data: '3fWa4b3Pi7YT' as Base58EncodedBytes,
              programIdIndex: 23,
              stackHeight: 2,
            },
            {
              accounts: [18, 30, 32, 31, 8, 6, 23, 43],
              data: 'KJbLmHu6nV7UqvDDcSRXaFUb' as Base58EncodedBytes,
              programIdIndex: 40,
              stackHeight: 2,
            },
            {
              accounts: [8, 32, 18],
              data: '3fWa4b3Pi7YT' as Base58EncodedBytes,
              programIdIndex: 23,
              stackHeight: 3,
            },
            {
              accounts: [31, 6, 30],
              data: '3GX2cxozGc1m' as Base58EncodedBytes,
              programIdIndex: 23,
              stackHeight: 3,
            },
            {
              accounts: [17],
              data: 'QMqFu4fYGGeUEysFnenhAvC84LqwVcxGQ4jSwmA9PGzJR1g2ER75NWZc21f6bKJsrmwYHcfVa7ixjCYtwp3uNHFMEaUUsNuibdeoCSCzWBybS4ZgW8UYtotFR7fBXnrGmADuUF2gespU9CTGYKo5FwDk2pgVJWD7rmEnQuZYt3jP4go' as Base58EncodedBytes,
              programIdIndex: 21,
              stackHeight: 2,
            },
            {
              accounts: [34, 19, 14, 36, 33, 7, 6, 35, 41, 43, 18, 23],
              data: '2j6vnwYDURn8yxm1zZVZQzwPQGTX2RdjMKD' as Base58EncodedBytes,
              programIdIndex: 42,
              stackHeight: 2,
            },
            {
              accounts: [6, 33, 18],
              data: '3GX2cxozGc1m' as Base58EncodedBytes,
              programIdIndex: 23,
              stackHeight: 3,
            },
            {
              accounts: [36, 7, 34],
              data: '3Deg5NNBD3yh' as Base58EncodedBytes,
              programIdIndex: 23,
              stackHeight: 3,
            },
            {
              accounts: [17],
              data: 'QMqFu4fYGGeUEysFnenhAvD866YwW6jMndC6NeFLmgrgSsQrYzqQkLQZLriiyYAHU6DY9CABySGbF8TQvwB3my7Y4x2mCV92TazD1F3CPHC5Lc2ErsMARmjtoTmKngZ6UR831Z5VpwjEVpgQy1kMxEdSemovvUGKpUJtf81j86nnjwd' as Base58EncodedBytes,
              programIdIndex: 21,
              stackHeight: 2,
            },
            {
              accounts: [23, 18, 29, 5, 24, 7, 25, 28, 26, 27, 37],
              data: '59p8WydnSZtRqYRRqT2PMbAzHZ5kroPaPguDn2DUNBt9mMjmgrrD9jkNAj' as Base58EncodedBytes,
              programIdIndex: 39,
              stackHeight: 2,
            },
            {
              accounts: [7, 25, 18],
              data: '3Deg5NNBD3yh' as Base58EncodedBytes,
              programIdIndex: 23,
              stackHeight: 3,
            },
            {
              accounts: [24, 5, 29],
              data: '3KhWHdLNoEX1' as Base58EncodedBytes,
              programIdIndex: 23,
              stackHeight: 3,
            },
            {
              accounts: [17],
              data: 'QMqFu4fYGGeUEysFnenhAvDWgqp1W7DbrMv3z8JcyrP4Bu3Yyyj7irLW76wEzMiFqiFwoETYwdqiPRSaEKSWpjDuenVF1jJfDrxNf9W2BiSt1cTq4rGGKEGDnUHBaeG8JVk6LXS6FpT2cMo8F66NJwvUCzpmd2rzL59NPvihcNdZ9ts' as Base58EncodedBytes,
              programIdIndex: 21,
              stackHeight: 2,
            },
            {
              accounts: [5, 2, 18],
              data: '3KhWHdLNoEX1' as Base58EncodedBytes,
              programIdIndex: 23,
              stackHeight: 2,
            },
          ],
        },
      ],
      loadedAddresses: {
        readonly: [
          address('65fuZoZgftu7midti6tErqGriTQP7qCng7MbFcMCN8LA'),
          address('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
          address('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'),
          address('SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe'),
          address('J4HJYz4p7TRP96WVFky3vh7XryxoFehHjoRySUTeSeXw'),
          address('obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y'),
          address('Sysvar1nstructions1111111111111111111111111'),
        ],
        writable: [
          address('2wSq4BswujbEARh57hC227PkNo9eMyGCv8mYV9SN7myj'),
          address('7fibbSXkUuc4HqPWnyszmtgwUnPzZJUQFBhZJTHUS5cL'),
          address('9d8PVkwKTspxXJBweAM9VNpaMMa5ApvvtK7PQtQrryca'),
          address('By7iRuzUgZriSBgezQYMtxi2tVpZd26UMevuvX48Vb7t'),
          address('Cb8LJ6KxA4TAB7qBpZxkBuReiimx2XiCMn6YqTuw6YK3'),
          address('FgTCR1ufcaTZMwZZYhNRhJm2K3HgMA8V8kXtdqyttm19'),
          address('3AbG3ZA19fJKjTSTMTCz7j2bodPagXog4PwTBi8H7UA4'),
          address('AHRTN52eBDEjMgJuLaTBUU6MkT5i9i6KMdGop8Fi7hkG'),
          address('HrYQMvm9ZSmnuQL1QKBqW3rzghikpVFgfD1ZHYw22JLo'),
          address('74tjvZXuW2C7bsBxRYxmwTrqF8BrYr3VDgusj8DwRd9a'),
          address('AvBSC1KmFNceHpD6jyyXBV6gMXFxZ8BJJ3HVUN8kCurJ'),
          address('FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q'),
          address('FpEzVYQ5MjuSut61Ka18tzYhQKLqndefubV7K2U1mrTz'),
        ],
      },
      logMessages: [
        'Program 3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br invoke [1]',
        'Program log: LI.FI TX: 0xB11205FAE4747F00',
        'Program 3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br consumed 6037 of 368756 compute units',
        'Program 3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br success',
        'Program ComputeBudget111111111111111111111111111111 invoke [1]',
        'Program ComputeBudget111111111111111111111111111111 success',
        'Program ComputeBudget111111111111111111111111111111 invoke [1]',
        'Program ComputeBudget111111111111111111111111111111 success',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
        'Program log: CreateIdempotent',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 5937 of 362419 compute units',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
        'Program log: Instruction: TransferChecked',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6241 of 356482 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
        'Program log: CreateIdempotent',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 4437 of 350241 compute units',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
        'Program log: Instruction: TransferChecked',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6146 of 345804 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
        'Program log: CreateIdempotent',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
        'Program log: Instruction: GetAccountDataSize',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 334253 compute units',
        'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program 11111111111111111111111111111111 invoke [2]',
        'Program 11111111111111111111111111111111 success',
        'Program log: Initialize the associated token account',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
        'Program log: Instruction: InitializeImmutableOwner',
        'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 327666 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
        'Program log: Instruction: InitializeAccount3',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4188 of 323784 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 20345 of 339658 compute units',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]',
        'Program log: Instruction: SharedAccountsRoute',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
        'Program log: Instruction: Transfer',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 315158 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe invoke [2]',
        'Program log: @@@:ICxWnWBKw+B8KqChdqtmFUFTafZWPRUSqTgDcc+vKWnXUB8BAAAAAHhvLRQAAAAAAAAAAAAAAAA=',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
        'Program log: Instruction: Transfer',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 209660 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
        'Program log: Instruction: Transfer',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 202875 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe consumed 109667 of 307657 compute units',
        'Program SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe success',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 184 of 196254 compute units',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
        'Program obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y invoke [2]',
        'Program log: Instruction: Swap',
        'Program log: price_x: 1477185',
        'Program log: price_y: 10000',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
        'Program log: Instruction: Transfer',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 141130 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
        'Program log: Instruction: Transfer',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 133609 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program log: YX15 205222432421,69134667029,543506,3679489',
        'Program obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y consumed 70812 of 193016 compute units',
        'Program obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y success',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 184 of 120468 compute units',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
        'Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc invoke [2]',
        'Program log: Instruction: Swap',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
        'Program log: Instruction: Transfer',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 83707 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
        'Program log: Instruction: Transfer',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 75911 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program data: 4cpJr5MroJbaHuOrSytMOWqa+q1Ljf62fmW+H6dODm4UjEISQuDWYABTuhAskupRsgEAAAAAAAAAmakUDDcNXLIBAAAAAAAAAAElOAAAAAAAJU8TAAAAAAAAAAAAAAAAAAAAAAAAAAAADH0AAAAAAACvEgAAAAAAAA==',
        'Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc consumed 49364 of 117109 compute units',
        'Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc success',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 184 of 66008 compute units',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
        'Program log: Instruction: Transfer',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 62894 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 261196 of 319313 compute units',
        'Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 JU8TAAAAAAA=',
        'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
      ],
      postBalances: [
        lamports(52309328n),
        lamports(2039280n),
        lamports(2039280n),
        lamports(2039280n),
        lamports(2039280n),
        lamports(2039280n),
        lamports(2039980n),
        lamports(278226640n),
        lamports(2039280n),
        lamports(1n),
        lamports(26304001609n),
        lamports(1141440n),
        lamports(114032932n),
        lamports(1345757052440n),
        lamports(29900160n),
        lamports(731913600n),
        lamports(1n),
        lamports(1017918n),
        lamports(2103217742n),
        lamports(8741760n),
        lamports(0n),
        lamports(1141440n),
        lamports(1169280n),
        lamports(934087680n),
        lamports(2039280n),
        lamports(81566957884n),
        lamports(70407360n),
        lamports(70407360n),
        lamports(70407360n),
        lamports(5435791n),
        lamports(22426783n),
        lamports(2039280n),
        lamports(2039280n),
        lamports(2039280n),
        lamports(5570241n),
        lamports(3167032033n),
        lamports(205220792213n),
        lamports(0n),
        lamports(71103633970n),
        lamports(1141440n),
        lamports(1141440n),
        lamports(2561280n),
        lamports(1141440n),
        lamports(0n),
      ],
      postTokenBalances: [
        {
          accountIndex: 1,
          mint: address('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
          owner: address('34FKjAdVcTax2DHqV2XnbXa9J3zmyKcFuFKWbcmgxjgm'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '6223747',
            decimals: 6,
            uiAmount: 6.223747,
            uiAmountString: '6.223747',
          },
        },
        {
          accountIndex: 2,
          mint: address('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
          owner: address('8VCfQcnssNJznDqDoDDuzoKhdxgZWwwe5ikcKbAVWet5'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '1265445',
            decimals: 6,
            uiAmount: 1.265445,
            uiAmountString: '1.265445',
          },
        },
        {
          accountIndex: 3,
          mint: address('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
          owner: address('4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '30506',
            decimals: 6,
            uiAmount: 0.030506,
            uiAmountString: '0.030506',
          },
        },
        {
          accountIndex: 4,
          mint: address('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
          owner: address('8VCfQcnssNJznDqDoDDuzoKhdxgZWwwe5ikcKbAVWet5'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '83590',
            decimals: 6,
            uiAmount: 0.08359,
            uiAmountString: '0.08359',
          },
        },
        {
          accountIndex: 5,
          mint: address('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
          owner: address('GGztQqQ6pCPaJQnNpXBgELr5cs3WwDakRbh1iEMzjgSJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '26482927',
            decimals: 6,
            uiAmount: 26.482927,
            uiAmountString: '26.482927',
          },
        },
        {
          accountIndex: 6,
          mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          owner: address('GGztQqQ6pCPaJQnNpXBgELr5cs3WwDakRbh1iEMzjgSJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '44965741',
            decimals: 6,
            uiAmount: 44.965741,
            uiAmountString: '44.965741',
          },
        },
        {
          accountIndex: 7,
          mint: address('So11111111111111111111111111111111111111112'),
          owner: address('GGztQqQ6pCPaJQnNpXBgELr5cs3WwDakRbh1iEMzjgSJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '276186969',
            decimals: 9,
            uiAmount: 0.276186969,
            uiAmountString: '0.276186969',
          },
        },
        {
          accountIndex: 8,
          mint: address('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
          owner: address('GGztQqQ6pCPaJQnNpXBgELr5cs3WwDakRbh1iEMzjgSJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '3169038',
            decimals: 6,
            uiAmount: 3.169038,
            uiAmountString: '3.169038',
          },
        },
        {
          accountIndex: 24,
          mint: address('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
          owner: address('FgTCR1ufcaTZMwZZYhNRhJm2K3HgMA8V8kXtdqyttm19'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '147713797837',
            decimals: 6,
            uiAmount: 147713.797837,
            uiAmountString: '147713.797837',
          },
        },
        {
          accountIndex: 25,
          mint: address('So11111111111111111111111111111111111111112'),
          owner: address('FgTCR1ufcaTZMwZZYhNRhJm2K3HgMA8V8kXtdqyttm19'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '81564918604',
            decimals: 9,
            uiAmount: 81.564918604,
            uiAmountString: '81.564918604',
          },
        },
        {
          accountIndex: 31,
          mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          owner: address('3AbG3ZA19fJKjTSTMTCz7j2bodPagXog4PwTBi8H7UA4'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '248776432133',
            decimals: 6,
            uiAmount: 248776.432133,
            uiAmountString: '248776.432133',
          },
        },
        {
          accountIndex: 32,
          mint: address('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
          owner: address('3AbG3ZA19fJKjTSTMTCz7j2bodPagXog4PwTBi8H7UA4'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '24228330103',
            decimals: 6,
            uiAmount: 24228.330103,
            uiAmountString: '24228.330103',
          },
        },
        {
          accountIndex: 33,
          mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          owner: address('AvBSC1KmFNceHpD6jyyXBV6gMXFxZ8BJJ3HVUN8kCurJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '69135210535',
            decimals: 6,
            uiAmount: 69135.210535,
            uiAmountString: '69135.210535',
          },
        },
        {
          accountIndex: 36,
          mint: address('So11111111111111111111111111111111111111112'),
          owner: address('AvBSC1KmFNceHpD6jyyXBV6gMXFxZ8BJJ3HVUN8kCurJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '205218752932',
            decimals: 9,
            uiAmount: 205.218752932,
            uiAmountString: '205.218752932',
          },
        },
      ] as TokenBalance[],
      preBalances: [
        lamports(54390484n),
        lamports(2039280n),
        lamports(0n),
        lamports(2039280n),
        lamports(2039280n),
        lamports(2039280n),
        lamports(2039980n),
        lamports(278226640n),
        lamports(2039280n),
        lamports(1n),
        lamports(26304001609n),
        lamports(1141440n),
        lamports(114032932n),
        lamports(1345757052440n),
        lamports(29900160n),
        lamports(731913600n),
        lamports(1n),
        lamports(1017918n),
        lamports(2103217742n),
        lamports(8741760n),
        lamports(0n),
        lamports(1141440n),
        lamports(1169280n),
        lamports(934087680n),
        lamports(2039280n),
        lamports(81563278395n),
        lamports(70407360n),
        lamports(70407360n),
        lamports(70407360n),
        lamports(5435791n),
        lamports(22426783n),
        lamports(2039280n),
        lamports(2039280n),
        lamports(2039280n),
        lamports(5570241n),
        lamports(3167032033n),
        lamports(205224471702n),
        lamports(0n),
        lamports(71103633970n),
        lamports(1141440n),
        lamports(1141440n),
        lamports(2561280n),
        lamports(1141440n),
        lamports(0n),
      ],
      preTokenBalances: [
        {
          accountIndex: 1,
          mint: address('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
          owner: address('34FKjAdVcTax2DHqV2XnbXa9J3zmyKcFuFKWbcmgxjgm'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '6223747',
            decimals: 6,
            uiAmount: 6.223747,
            uiAmountString: '6.223747',
          },
        },
        {
          accountIndex: 3,
          mint: address('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
          owner: address('4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '30069',
            decimals: 6,
            uiAmount: 0.030069,
            uiAmountString: '0.030069',
          },
        },
        {
          accountIndex: 4,
          mint: address('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
          owner: address('8VCfQcnssNJznDqDoDDuzoKhdxgZWwwe5ikcKbAVWet5'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '133590',
            decimals: 6,
            uiAmount: 0.13359,
            uiAmountString: '0.13359',
          },
        },
        {
          accountIndex: 5,
          mint: address('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
          owner: address('GGztQqQ6pCPaJQnNpXBgELr5cs3WwDakRbh1iEMzjgSJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '26482927',
            decimals: 6,
            uiAmount: 26.482927,
            uiAmountString: '26.482927',
          },
        },
        {
          accountIndex: 6,
          mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          owner: address('GGztQqQ6pCPaJQnNpXBgELr5cs3WwDakRbh1iEMzjgSJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '44965741',
            decimals: 6,
            uiAmount: 44.965741,
            uiAmountString: '44.965741',
          },
        },
        {
          accountIndex: 7,
          mint: address('So11111111111111111111111111111111111111112'),
          owner: address('GGztQqQ6pCPaJQnNpXBgELr5cs3WwDakRbh1iEMzjgSJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '276186969',
            decimals: 9,
            uiAmount: 0.276186969,
            uiAmountString: '0.276186969',
          },
        },
        {
          accountIndex: 8,
          mint: address('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
          owner: address('GGztQqQ6pCPaJQnNpXBgELr5cs3WwDakRbh1iEMzjgSJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '3169038',
            decimals: 6,
            uiAmount: 3.169038,
            uiAmountString: '3.169038',
          },
        },
        {
          accountIndex: 24,
          mint: address('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
          owner: address('FgTCR1ufcaTZMwZZYhNRhJm2K3HgMA8V8kXtdqyttm19'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '147715063282',
            decimals: 6,
            uiAmount: 147715.063282,
            uiAmountString: '147715.063282',
          },
        },
        {
          accountIndex: 25,
          mint: address('So11111111111111111111111111111111111111112'),
          owner: address('FgTCR1ufcaTZMwZZYhNRhJm2K3HgMA8V8kXtdqyttm19'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '81561239115',
            decimals: 9,
            uiAmount: 81.561239115,
            uiAmountString: '81.561239115',
          },
        },
        {
          accountIndex: 31,
          mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          owner: address('3AbG3ZA19fJKjTSTMTCz7j2bodPagXog4PwTBi8H7UA4'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '248776975639',
            decimals: 6,
            uiAmount: 248776.975639,
            uiAmountString: '248776.975639',
          },
        },
        {
          accountIndex: 32,
          mint: address('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
          owner: address('3AbG3ZA19fJKjTSTMTCz7j2bodPagXog4PwTBi8H7UA4'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '24228280540',
            decimals: 6,
            uiAmount: 24228.28054,
            uiAmountString: '24228.28054',
          },
        },
        {
          accountIndex: 33,
          mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          owner: address('AvBSC1KmFNceHpD6jyyXBV6gMXFxZ8BJJ3HVUN8kCurJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '69134667029',
            decimals: 6,
            uiAmount: 69134.667029,
            uiAmountString: '69134.667029',
          },
        },
        {
          accountIndex: 36,
          mint: address('So11111111111111111111111111111111111111112'),
          owner: address('AvBSC1KmFNceHpD6jyyXBV6gMXFxZ8BJJ3HVUN8kCurJ'),
          programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          uiTokenAmount: {
            amount: '205222432421',
            decimals: 9,
            uiAmount: 205.222432421,
            uiAmountString: '205.222432421',
          },
        },
      ] as TokenBalance[],
      returnData: {
        data: [
          'JU8TAAAAAAA=', // This is Base58, but the type expects Base64EncodedDataResponse
          'base64',
        ] as Base64EncodedDataResponse, // Explicit cast, assuming the first element is actually base64 in this context
        programId: address('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
      },
      rewards: [],
      status: {
        Ok: null,
      },
    } as SolanaTransaction['meta'],
    slot: 338521977n as Slot,
    transaction: {
      message: {
        accountKeys: [
          address('8VCfQcnssNJznDqDoDDuzoKhdxgZWwwe5ikcKbAVWet5'),
          address('4Hf3wte9KU2y23sX4KQu6bzKXw25A6KyA8a262xP5B8c'),
          address('57umWGXvPYbUT6SteYh4j7nz7FmgfRsveY1KhfJMHtxL'),
          address('5GLUj9QA3ZHehzas4Wr8GbyK4EKjHFhAmz5aFrvVLmTv'),
          address('DKvDup2As97yqRn4YBh8gWsUgShoWD1Vm8mT65teeLLL'),
          address('DqHAep7hD2VJ4rsWSxkLoBSRMiLkdw7y8DLx1htrryts'),
          address('DVCeozFGbe6ew3eWTnZByjHeYqTq1cvbrB7JJhkLxaRJ'),
          address('g7dD1FHSemkUQrX1Eak37wzvDjscgBW2pFCENwjLdMX'),
          address('K8E3xRZtDZQck2vFLUN2AqQUwMS8n9LUB3iNy26M5Au'),
          address('11111111111111111111111111111111'),
          address('34FKjAdVcTax2DHqV2XnbXa9J3zmyKcFuFKWbcmgxjgm'),
          address('3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br'),
          address('4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA'),
          address('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
          address('6YawcNeZ74tRyCv4UfGydYMr7eho7vbUR6ScVffxKAb3'),
          address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
          address('ComputeBudget111111111111111111111111111111'),
          address('D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf'),
          address('GGztQqQ6pCPaJQnNpXBgELr5cs3WwDakRbh1iEMzjgSJ'),
          address('GZsNmWKbqhMYtdSkkvMdEyQF9k5mLmP7tTKYWZjcHVPE'),
          address('HY5DRuc8ckTipvzgKYKoEwRxv1X29iLuBLZoxFfE1RwX'),
          address('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
          address('SysvarC1ock11111111111111111111111111111111'),
          address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        ],
        addressTableLookups: [
          {
            accountKey: address('6GqRFWez6gvo8yPcj421ZpkhQ2N8ZZFeNezWVj46A58j'),
            readableIndexes: [107, 108, 8],
            writableIndexes: [106, 117, 111, 116, 105, 104],
          },
          {
            accountKey: address('EVvmYfSrZ2FEaVj6gy4zanhptAyWeQAkwVjxpNU7ikDi'),
            readableIndexes: [81],
            writableIndexes: [79, 83, 82],
          },
          {
            accountKey: address('Gd4QckpGyrmxfqwryNrdMp1ZxHwut162X3t1b3AoeAUL'),
            readableIndexes: [18, 16, 15],
            writableIndexes: [19, 13, 14, 17],
          },
        ],
        header: {
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 15,
          numRequiredSignatures: 1,
        },
        instructions: [
          {
            accounts: [22, 20],
            data: '1Wcog6GC9QCw' as Base58EncodedBytes,
            programIdIndex: 11,
            stackHeight: null,
          },
          {
            accounts: [],
            data: 'H4xyQb' as Base58EncodedBytes,
            programIdIndex: 16,
            stackHeight: null,
          },
          {
            accounts: [],
            data: '3gJqkocMWaMm' as Base58EncodedBytes,
            programIdIndex: 16,
            stackHeight: null,
          },
          {
            accounts: [0, 1, 10, 13, 9, 23],
            data: '2' as Base58EncodedBytes,
            programIdIndex: 15,
            stackHeight: null,
          },
          {
            accounts: [4, 13, 1, 0],
            data: 'g6wxXSFr4ddxH' as Base58EncodedBytes,
            programIdIndex: 23,
            stackHeight: null,
          },
          {
            accounts: [0, 3, 12, 13, 9, 23],
            data: '2' as Base58EncodedBytes,
            programIdIndex: 15,
            stackHeight: null,
          },
          {
            accounts: [4, 13, 3, 0],
            data: 'iQaRUCA551Mth' as Base58EncodedBytes,
            programIdIndex: 23,
            stackHeight: null,
          },
          {
            accounts: [0, 2, 0, 38, 9, 23],
            data: '2' as Base58EncodedBytes,
            programIdIndex: 15,
            stackHeight: null,
          },
          {
            accounts: [
              23, 18, 0, 4, 8, 5, 2, 13, 38, 21, 21, 17, 21, 40, 18, 30, 32, 31,
              8, 6, 23, 43, 42, 34, 19, 14, 36, 33, 7, 6, 35, 41, 43, 18, 23,
              39, 23, 18, 29, 5, 24, 7, 25, 28, 26, 27, 37,
            ],
            data: '2c6R1b1rL9gFMrxfe1nBmwGYJV9DvjmDmJETR9i8YiXRUoUUa3q5a8v6Uu7SKMBn7' as Base58EncodedBytes,
            programIdIndex: 21,
            stackHeight: null,
          },
        ],
        recentBlockhash: blockhash(
          'Di1iRQCxiu1FCTSC76uRVnmfN3DNDKzwCMaUQUBZMXUA',
        ),
      },
      signatures: [
        '4VhDRLUK5QDZ6kgN9PCeEoztUraCibwYA3XaLZUKhfwWxqeN96Qg7Ep4w2j5C1VtggbuU6dqkGczGC537byu9hG3' as Base58EncodedBytes,
      ],
    },
    version: 0 as TransactionVersion,
  } as SolanaTransaction,
  id: 1,
};

export const EXPECTED_SWAP_TRUMP_TO_JUP_DATA: SolanaTransaction =
  RPC_RESPONSE_SWAP_TRUMP_TO_JUP_DATA.result;
