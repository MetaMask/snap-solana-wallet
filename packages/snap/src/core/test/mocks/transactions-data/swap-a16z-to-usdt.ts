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
 * Mainnet - Swap A16Z to USDT via Jupiter Aggregator V6
 * Transaction: JiqYGkWcYu8GxPZsMdXDnA8tkZvHnHVmNuKr4JYBErm4rgQWssdHCkbe8MzwwNGndyvyNYaaY5vvMhUMPNiQX9u
 *
 * Accounts involved:
 * - FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6: User wallet
 * - Jupiter V6 Program: routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS
 * - Various AMM pools and token accounts involved in the swap route.
 */
export const EXPECTED_SWAP_A16Z_TO_USDT_DATA: SolanaTransaction = {
  blockTime: 1745425114n as UnixTimestamp,
  meta: {
    computeUnitsConsumed: 242108n,
    // eslint-disable-next-line id-denylist
    err: null,
    fee: lamports(22342n),
    innerInstructions: [
      {
        index: 0,
        instructions: [
          {
            accounts: [0, 18, 7, 15, 5, 8, 14, 1, 30, 31, 25, 22, 20, 16, 6, 9],
            data: 'ASCsAbe1UnEFMJQbPShDspA4Mtrgik54fGtKfUGEGt7vQU77d7XfBrbz' as Base58EncodedBytes,
            programIdIndex: 29,
            stackHeight: 2,
          },
          {
            accounts: [15, 22, 8, 0],
            data: 'hHi4Sy5CUXcNU' as Base58EncodedBytes,
            programIdIndex: 31,
            stackHeight: 3,
          },
          {
            accounts: [14, 20, 5, 7],
            data: 'hvZoChyXb9GHj' as Base58EncodedBytes,
            programIdIndex: 30,
            stackHeight: 3,
          },
          {
            accounts: [0, 17, 0, 23, 27, 30],
            data: '1' as Base58EncodedBytes,
            programIdIndex: 28,
            stackHeight: 2,
          },
          {
            accounts: [23],
            data: '84eT' as Base58EncodedBytes,
            programIdIndex: 30,
            stackHeight: 3,
          },
          {
            accounts: [0, 17],
            data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL' as Base58EncodedBytes,
            programIdIndex: 27,
            stackHeight: 3,
          },
          {
            accounts: [17],
            data: 'P' as Base58EncodedBytes,
            programIdIndex: 30,
            stackHeight: 3,
          },
          {
            accounts: [17, 23],
            data: '6bY9pNeU2qwkJgSyHZ9tDZHS8MKeAVk2hkGBGD7vwkPE4' as Base58EncodedBytes,
            programIdIndex: 30,
            stackHeight: 3,
          },
          {
            accounts: [
              0, 19, 21, 5, 17, 2, 10, 3, 30, 31, 25, 20, 23, 4, 11, 13, 12,
            ],
            data: 'ASCsAbe1UnEWBUtPg3Atg89hojMN2wioE7NPdqjnx7TMCWqZ1nvkcNaC' as Base58EncodedBytes,
            programIdIndex: 29,
            stackHeight: 2,
          },
          {
            accounts: [5, 20, 2, 0],
            data: 'hvZoChyXb9GHj' as Base58EncodedBytes,
            programIdIndex: 30,
            stackHeight: 3,
          },
          {
            accounts: [10, 23, 17, 21],
            data: 'gDAuq2Hq93qJY' as Base58EncodedBytes,
            programIdIndex: 30,
            stackHeight: 3,
          },
        ],
      },
      {
        index: 1,
        instructions: [
          {
            accounts: [17, 0, 0],
            data: 'A' as Base58EncodedBytes,
            programIdIndex: 30,
            stackHeight: 2,
          },
        ],
      },
    ],
    loadedAddresses: {
      readonly: [
        address('11111111111111111111111111111111'),
        address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
        address('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK'),
        address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
      ] as Address[],
      writable: [] as Address[],
    },
    logMessages: [
      'Program routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS invoke [1]',
      'Program log: process_swap_base_in_with_user_account:RouteSwapBaseInArgs { amount_in: 21898077, minimum_amount_out: 28017 }',
      'Program CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK invoke [2]',
      'Program log: Instruction: SwapV2',
      'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [3]',
      'Program log: Instruction: TransferChecked',
      'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 2456 of 180764 compute units',
      'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: TransferChecked',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6200 of 174335 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program data: QMbN6CYIceIy+VeK7Au3qP50Lrwtv7uwHdH4xQ+z0Xeka0TEPG8rytYFidOEwxq1G3dAz8FbZnBrVGJqOoS/llPmNsEZAQ7FLHM8VXURkc4gyDrjlDFQObpDo3uak0HiKoZIdhklseqlkOi1LRzjiyuwA2EANVitiSEvYYy1jzRrpbfRje6Ch48QAAAAAAAAAAAAAAAAAABdI04BAAAAAAAAAAAAAAAAACO/h4hC1uDeRwAAAAAAAABD804SAAAAAAAAAAAAAAAA/U0BAA==',
      'Program CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK consumed 80238 of 241826 compute units',
      'Program CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK success',
      'Program log: 21898077 -> 4239',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [2]',
      'Program log: Create',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: GetAccountDataSize',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 146424 compute units',
      'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program 11111111111111111111111111111111 invoke [3]',
      'Program 11111111111111111111111111111111 success',
      'Program log: Initialize the associated token account',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: InitializeImmutableOwner',
      'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 139837 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: InitializeAccount3',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3158 of 135955 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 19307 of 151821 compute units',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
      'Program CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK invoke [2]',
      'Program log: Instruction: SwapV2',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: TransferChecked',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6200 of 62483 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: TransferChecked',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6238 of 52310 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program data: QMbN6CYIceLPZqd3cc+gFFF/2cRVEgwL+6XlbKisjoCilx8qb/dSm9YFidOEwxq1G3dAz8FbZnBrVGJqOoS/llPmNsEZAQ7FqmxvO7L2St3gqkrUz9uoFap7gJpI0DPYgWRm3HmP1lUsczxVdRGRziDIOuOUMVA5ukOje5qTQeIqhkh2GSWx6ghuAAAAAAAAAAAAAAAAAACPEAAAAAAAAAAAAAAAAAAAAAek/1ABHExjAAAAAAAAAAC3URk9WQAAAAAAAAAAAAAAAbb//w==',
      'Program CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK consumed 76582 of 116092 compute units',
      'Program CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK success',
      'Program log: 4239 -> 28168',
      'Program routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS consumed 234315 of 270090 compute units',
      'Program routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS success',
      'Program routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS invoke [1]',
      'Program log: process_close_token_account',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: CloseAccount',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2915 of 31490 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS consumed 7493 of 35775 compute units',
      'Program routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS success',
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
    ],
    postBalances: [
      lamports(163148592n),
      lamports(32092560n),
      lamports(2039680n),
      lamports(32092960n),
      lamports(13642000n),
      lamports(2039280n),
      lamports(72161280n),
      lamports(11637120n),
      lamports(2039280n),
      lamports(72161280n),
      lamports(263336368076n),
      lamports(72161280n),
      lamports(72161280n),
      lamports(72161280n),
      lamports(2039280n),
      lamports(2074080n),
      lamports(13641600n),
      lamports(0n),
      lamports(1705200n),
      lamports(1705500n),
      lamports(114473352734n),
      lamports(13645861n),
      lamports(18359024537n),
      lamports(1028469402250n),
      lamports(1n),
      lamports(521498880n),
      lamports(1141440n),
      lamports(1n),
      lamports(731913600n),
      lamports(1141440n),
      lamports(934087680n),
      lamports(1141440n),
    ],
    postTokenBalances: [
      {
        accountIndex: 2,
        mint: address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), // USDT
        owner: address('ExcBWu8fGPdJiaF1b1z3iEef38sjQJks8xvj6M85pPY6'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '24814019869' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 24814.019869,
          uiAmountString: '24814.019869' as StringifiedNumber,
        },
      },
      {
        accountIndex: 5,
        mint: address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), // USDT
        owner: address('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'), // User wallet
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '0' as StringifiedBigInt, // User received 28168 USDT smallest units (0.028168 USDT)
          decimals: 6,
          uiAmount: null,
          uiAmountString: '0' as StringifiedNumber,
        },
      },
      {
        accountIndex: 8,
        mint: address('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'), // A16Z
        owner: address('4RyuSgGdYeE7Qd4eKsuauTevWRreSfGScYqaygMEJXSq'),
        programId: address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
        uiTokenAmount: {
          amount: '51518656793' as StringifiedBigInt,
          decimals: 9,
          uiAmount: 51.518656793,
          uiAmountString: '51.518656793' as StringifiedNumber,
        },
      },
      {
        accountIndex: 10,
        mint: address('So11111111111111111111111111111111111111112'), // WSOL
        owner: address('ExcBWu8fGPdJiaF1b1z3iEef38sjQJks8xvj6M85pPY6'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '263334328396' as StringifiedBigInt,
          decimals: 9,
          uiAmount: 263.334328396,
          uiAmountString: '263.334328396' as StringifiedNumber,
        },
      },
      {
        accountIndex: 14,
        mint: address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), // USDT
        owner: address('4RyuSgGdYeE7Qd4eKsuauTevWRreSfGScYqaygMEJXSq'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '10667087' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 10.667087,
          uiAmountString: '10.667087' as StringifiedNumber,
        },
      },
      {
        accountIndex: 15,
        mint: address('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'), // A16Z
        owner: address('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'), // User wallet
        programId: address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
        uiTokenAmount: {
          amount: '21898077' as StringifiedBigInt, // User had 43796154, sent 21898077, remaining 21898077
          decimals: 9,
          uiAmount: 0.021898077,
          uiAmountString: '0.021898077' as StringifiedNumber,
        },
      },
    ],
    preBalances: [
      lamports(163142766n),
      lamports(32092560n),
      lamports(2039680n),
      lamports(32092960n),
      lamports(13642000n),
      lamports(2039280n),
      lamports(72161280n),
      lamports(11637120n),
      lamports(2039280n),
      lamports(72161280n),
      lamports(263336396244n),
      lamports(72161280n),
      lamports(72161280n),
      lamports(72161280n),
      lamports(2039280n),
      lamports(2074080n),
      lamports(13641600n),
      lamports(0n),
      lamports(1705200n),
      lamports(1705500n),
      lamports(114473352734n),
      lamports(13645861n),
      lamports(18359024537n),
      lamports(1028469402250n),
      lamports(1n),
      lamports(521498880n),
      lamports(1141440n),
      lamports(1n),
      lamports(731913600n),
      lamports(1141440n),
      lamports(934087680n),
      lamports(1141440n),
    ],
    preTokenBalances: [
      {
        accountIndex: 2,
        mint: address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), // USDT
        owner: address('ExcBWu8fGPdJiaF1b1z3iEef38sjQJks8xvj6M85pPY6'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '24814015630' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 24814.01563,
          uiAmountString: '24814.01563' as StringifiedNumber,
        },
      },
      {
        accountIndex: 5,
        mint: address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), // USDT
        owner: address('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'), // User wallet
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '0' as StringifiedBigInt,
          decimals: 6,
          uiAmount: null,
          uiAmountString: '0' as StringifiedNumber,
        },
      },
      {
        accountIndex: 8,
        mint: address('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'), // A16Z
        owner: address('4RyuSgGdYeE7Qd4eKsuauTevWRreSfGScYqaygMEJXSq'),
        programId: address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
        uiTokenAmount: {
          amount: '51496758716' as StringifiedBigInt,
          decimals: 9,
          uiAmount: 51.496758716,
          uiAmountString: '51.496758716' as StringifiedNumber,
        },
      },
      {
        accountIndex: 10,
        mint: address('So11111111111111111111111111111111111111112'), // WSOL
        owner: address('ExcBWu8fGPdJiaF1b1z3iEef38sjQJks8xvj6M85pPY6'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '263334356564' as StringifiedBigInt,
          decimals: 9,
          uiAmount: 263.334356564,
          uiAmountString: '263.334356564' as StringifiedNumber,
        },
      },
      {
        accountIndex: 14,
        mint: address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), // USDT
        owner: address('4RyuSgGdYeE7Qd4eKsuauTevWRreSfGScYqaygMEJXSq'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '10671326' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 10.671326,
          uiAmountString: '10.671326' as StringifiedNumber,
        },
      },
      {
        accountIndex: 15,
        mint: address('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'), // A16Z
        owner: address('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'), // User wallet
        programId: address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
        uiTokenAmount: {
          amount: '43796154' as StringifiedBigInt, // User has 0.043796154 A16Z
          decimals: 9,
          uiAmount: 0.043796154,
          uiAmountString: '0.043796154' as StringifiedNumber,
        },
      },
    ],
    rewards: [],
    status: {
      Ok: null,
    },
  },
  slot: 335404896n,
  transaction: {
    message: {
      accountKeys: [
        address('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'),
        address('2omU3uDsWJJjcM7XZ8BrELuN1RysYk9Gc3pYUZNTYav4'),
        address('2w6WUGXVeUPeGpJTUSNu4btbpMkFtmjrQgpKi149it7K'),
        address('3AsJZQY3jtZwqBfbTUQ4xKDVwmdz2ufdKMsnxN9K5L3S'),
        address('3xVTGrrbWLtPC2qRiHyiVbKEDY2UUYN9kwJWmPH2n8wW'),
        address('3zWrWv3hu6fJfqpZech7sPLrF4Lm7qx1mmfMaHdJZyTP'),
        address('4odFEFnsNWHdj7P7RZ7fVWS86NJyB1LVG8U1Bec1eJSD'),
        address('4RyuSgGdYeE7Qd4eKsuauTevWRreSfGScYqaygMEJXSq'),
        address('5M3c33wKLoPRBUN24dCp9xrug6RvgB57ccQAwsmHBtvn'),
        address('6B9u2WAAqr7GExuCPfXQ159EeAoebtJKEawr84GVoy1n'),
        address('7CoLodcm9h4EAFKpcPbT34yk3MkpeWjsBqXVidfbrfQ7'),
        address('9dz29uZsFQWkwgMGcPYqrWo8DiGjErDo7uNULWRGfNR8'),
        address('9KgS9EwmhKp1aiGHYXFLv3qSgp2HHtFtNP5tKsVRDCp2'),
        address('AtTKYTWtb2nPF7B9RUYb3FXQn8Er9bCFnupMsXy5MKci'),
        address('BfrpfwfvvRbswT5jPqy4Ey9iek9PsBCXssF4hCa4UZ7u'),
        address('C9JRr8XMCatQ9kSii8VNHLMHQWfcA1pHCzhR5M1xAYUv'),
        address('ChSvYbQCjvpHhCsZRm8rFJGbSWYE6csJp1bNsTrYZtNS'),
        address('CUGD6t9tqqdQnq35Cr28S3yQLxw3ecLGSGgk6HoSxtDA'),
        address('DrdecJVzkaRsf1TQu1g7iFncaokikVTHqpzPjenjRySY'),
        address('EdPxg8QaeFSrTYqdWJn6Kezwy9McWncTYueD9eMGCuzR'),
        address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), // USDT Mint
        address('ExcBWu8fGPdJiaF1b1z3iEef38sjQJks8xvj6M85pPY6'),
        address('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'), // A16Z Mint
        address('So11111111111111111111111111111111111111112'), // WSOL Mint
        address('ComputeBudget111111111111111111111111111111'),
        address('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        address('routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS'), // Jupiter V6 Router
        // Lookup Table accounts start here (indices relative to lookup table, not accountKeys)
        address('11111111111111111111111111111111'), // System Program (LUT index 0)
        address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'), // Associated Token Program (LUT index 1)
        address('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK'), // Orca Whirlpool Program (LUT index 2)
        address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token Program (LUT index 3)
        address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'), // Token Extensions Program (LUT index ?) - This seems missing in LUT data but used by inner instructions
      ] as Address[],
      addressTableLookups: [
        {
          accountKey: address('2immgwYNHBbyVQKVGCEkgWpi53bLwWNRMB5G2nbgYV17'),
          readableIndexes: [0, 1, 2, 3, 7, 16], // Corrected based on lookup table usage (indices are for LUT content)
          writableIndexes: [],
        },
      ],
      header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 3, // FQT9SS... is signer, others are readonly
        numRequiredSignatures: 1,
      },
      instructions: [
        {
          // Jupiter V6 instruction
          accounts: [
            30, // Token Program
            31, // Token Extensions Program
            28, // Associated Token Program
            27, // System Program
            0, // User Wallet (signer)
            15, // User A16Z ATA (source)
            17, // User USDT ATA (destination - to be created)
            29, // Orca Whirlpool Program
            5, // User USDT ATA (owner for creation check?) - Seems redundant
            22, // A16Z Mint
            20, // USDT Mint
            18, // Orca Whirlpool A16Z/USDC Pool State
            7, // Orca Pool A16Z Vault
            8, // Orca Pool A16Z Vault ATA? (derived)
            14, // Orca Pool USDT Vault
            1, // Orca Pool USDT Vault ATA? (derived)
            25, // Memo Program
            16, // Orca Whirlpool WSOL/USDC Pool State
            6, // Orca Pool WSOL Vault
            9, // Orca Pool WSOL Vault ATA? (derived)
            // Duplicated accounts for second leg of swap?
            29, // Orca Whirlpool Program
            17, // User USDT ATA (now exists)
            20, // USDT Mint
            23, // WSOL Mint
            19, // Orca Whirlpool USDT/WSOL Pool State?
            21, // Orca Pool USDT Vault
            2, // Orca Pool USDT Vault ATA? (derived)
            10, // Orca Pool WSOL Vault
            3, // Orca Pool WSOL Vault ATA? (derived)
            25, // Memo Program
            4, // Some other Orca account?
            11, // Some other Orca account?
            13, // Some other Orca account?
            12, // Some other Orca account?
          ],
          data: '14RAD42BejNvLRNHtxMURkEQqVc63YKJdsQLhJdCPt3y9WaCEf9nWn29megzLgkjoRy' as Base58EncodedBytes,
          programIdIndex: 26, // Jupiter V6 Router
          stackHeight: null,
        },
        {
          // Jupiter V6 close empty ATA instruction
          accounts: [
            0, // User Wallet (rent receiver)
            17, // User USDT ATA (the one created, might be empty if swap failed?)
            0, // Owner (user wallet again)
            30, // Token Program
            28, // Associated Token Program
            27, // System Program
          ],
          data: '7' as Base58EncodedBytes,
          programIdIndex: 26, // Jupiter V6 Router
          stackHeight: null,
        },
        {
          // Compute Budget: Set Compute Unit Limit
          accounts: [],
          data: '3ounyg1gTkfR' as Base58EncodedBytes,
          programIdIndex: 24, // Compute Budget Program
          stackHeight: null,
        },
        {
          // Compute Budget: Set Compute Unit Price
          accounts: [],
          data: 'EM4xLX' as Base58EncodedBytes,
          programIdIndex: 24, // Compute Budget Program
          stackHeight: null,
        },
      ],
      recentBlockhash: blockhash(
        'FB1pi3RABPcFSam7o187Br6r6Tr7LUmN3GaoHJYEhEot',
      ),
    },
    signatures: [
      'JiqYGkWcYu8GxPZsMdXDnA8tkZvHnHVmNuKr4JYBErm4rgQWssdHCkbe8MzwwNGndyvyNYaaY5vvMhUMPNiQX9u',
    ] as Base58EncodedBytes[],
  },
  version: 0 as TransactionVersion,
};
