import type {
  Base58EncodedBytes,
  StringifiedBigInt,
  StringifiedNumber,
} from '@solana/kit';
import { address, blockhash, lamports, type UnixTimestamp } from '@solana/kit';

import type { SolanaTransaction } from '../../../types/solana';

export const EXPECTED_SEND_USDC_TRANSFER_TO_SELF_2_DATA: SolanaTransaction = {
  blockTime: 1747059490n as UnixTimestamp,
  meta: {
    computeUnitsConsumed: 26996n,
    // eslint-disable-next-line id-denylist
    err: null,
    fee: lamports(5270n),
    innerInstructions: [
      {
        index: 1,
        instructions: [
          {
            accounts: [7],
            data: '84eT' as Base58EncodedBytes,
            programIdIndex: 8,
            stackHeight: 2,
          },
          {
            accounts: [0, 1],
            data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL' as Base58EncodedBytes,
            programIdIndex: 3,
            stackHeight: 2,
          },
          {
            accounts: [1],
            data: 'P' as Base58EncodedBytes,
            programIdIndex: 8,
            stackHeight: 2,
          },
          {
            accounts: [1, 7],
            data: '6VnvmvXDQrwarVifa4tnxK6ReroTHnai7MRaDpcE2rAyg' as Base58EncodedBytes,
            programIdIndex: 8,
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
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
      'Program log: CreateIdempotent',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: GetAccountDataSize',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1622 of 19863 compute units',
      'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program 11111111111111111111111111111111 invoke [2]',
      'Program 11111111111111111111111111111111 success',
      'Program log: Initialize the associated token account',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: InitializeImmutableOwner',
      'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 13223 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: InitializeAccount3',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4241 of 9339 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 22052 of 26846 compute units',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 4794 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
    ],
    postBalances: [
      lamports(2090412273n),
      lamports(2039280n),
      lamports(2039280n),
      lamports(1n),
      lamports(0n),
      lamports(731913600n),
      lamports(1n),
      lamports(390010697122n),
      lamports(934087680n),
    ],
    postTokenBalances: [
      {
        accountIndex: 1,
        mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        owner: address('9fE6zKgca6K2EEa3yjbcq7zGMusUNqSQeWQNL2YDZ2Yi'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '1000000' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 1.0,
          uiAmountString: '1' as StringifiedNumber,
        },
      },
      {
        accountIndex: 2,
        mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        owner: address('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '8405777' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 8.405777,
          uiAmountString: '8.405777' as StringifiedNumber,
        },
      },
    ],
    preBalances: [
      lamports(2092456823n),
      lamports(0n),
      lamports(2039280n),
      lamports(1n),
      lamports(0n),
      lamports(731913600n),
      lamports(1n),
      lamports(390010697122n),
      lamports(934087680n),
    ],
    preTokenBalances: [
      {
        accountIndex: 2,
        mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        owner: address('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: '9405777' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 9.405777,
          uiAmountString: '9.405777' as StringifiedNumber,
        },
      },
    ],
    rewards: [],
    status: {
      Ok: null,
    },
  },
  slot: 339540943n,
  transaction: {
    message: {
      accountKeys: [
        address('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'),
        address('FrbudWWrsiv5deKG483U91njmeFPV45s3DQUfjhDD2BZ'),
        address('JBoHYN5t2NW6fUwDNXyYdQjKwRea6pMkRNqBSB2nFxUH'),
        address('11111111111111111111111111111111'),
        address('9fE6zKgca6K2EEa3yjbcq7zGMusUNqSQeWQNL2YDZ2Yi'),
        address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
        address('ComputeBudget111111111111111111111111111111'),
        address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      ],
      addressTableLookups: [],
      header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 6,
        numRequiredSignatures: 1,
      },
      instructions: [
        {
          accounts: [],
          data: '3GAG5eogvTjV' as Base58EncodedBytes,
          programIdIndex: 6,
          stackHeight: null,
        },
        {
          accounts: [0, 1, 4, 7, 3, 8],
          data: '2' as Base58EncodedBytes,
          programIdIndex: 5,
          stackHeight: null,
        },
        {
          accounts: [2, 1, 0],
          data: '3QCwqmHZ4mdq' as Base58EncodedBytes,
          programIdIndex: 8,
          stackHeight: null,
        },
        {
          accounts: [],
          data: 'H4eVYK' as Base58EncodedBytes,
          programIdIndex: 6,
          stackHeight: null,
        },
      ],
      recentBlockhash: blockhash(
        '41mww1wbRbSjvBaXwue59UpGr2K58Kxf8Zq59wgo7b5w',
      ),
    },
    signatures: [
      'LPaVYsnhx2q9yTeU7bf5vLESBdm6BYatMSdZqt6CYy8wcX5YFm6rNKZLXJqRA7jyq2w3nbEqfB4qgCFSGS1L6GT' as Base58EncodedBytes,
    ],
  },
  version: 0,
};
