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
 * Mainnet - Send SOL and Create Token Account (HeLp)
 * Transaction: 4G24SgaZ3gU92HAB8xwSVg6WXS7NcGtUpHMnQ5RTwBw9bG5x8y6co5TzqqPXbExovY2NAuPjE9393TCHFZVhS8K9
 *
 * Senders:
 * EMmTjuHsYCYX7vgPcQ2QVbNwYAwcvGoSMCEaHKc19DdE sends SOL and creates a token account for A16Z token
 *
 * Receivers:
 * BYh4CfuGDvFMKaZp3RPmkw9y6qg3sWukA2TiGJDeLKZi receives A16Z tokens
 */
export const EXPECTED_SEND_SPL_TOKEN_AND_CREATE_TOKEN_ACCOUNT_DATA: SolanaTransaction =
  {
    blockTime: 1745927033n as UnixTimestamp,
    meta: {
      computeUnitsConsumed: 22184n,
      // eslint-disable-next-line id-denylist
      err: null,
      fee: lamports(5222n),
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
              data: '11119ExAoTptm6xKUTUcw2V69MKmyEdDmRins3j3bK43o9nHeiYUtSiaT9pc292PhNQvxj' as Base58EncodedBytes,
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
              data: '6XgPj8sS4WmXBb4fL8ab7EubMbjFsHGBSrwdZksuTdTzg' as Base58EncodedBytes,
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
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]',
        'Program log: Instruction: GetAccountDataSize',
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 1436 of 13638 compute units',
        'Program return: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb qgAAAAAAAAA=',
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success',
        'Program 11111111111111111111111111111111 invoke [2]',
        'Program 11111111111111111111111111111111 success',
        'Program log: Initialize the associated token account',
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]',
        'Program log: Instruction: InitializeImmutableOwner',
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 529 of 7272 compute units',
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success',
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]',
        'Program log: Instruction: InitializeAccount3',
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 2167 of 4353 compute units',
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 20152 of 22034 compute units',
        'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [1]',
        'Program log: Instruction: Transfer',
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 1732 of 1882 compute units',
        'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success',
        'Program ComputeBudget111111111111111111111111111111 invoke [1]',
        'Program ComputeBudget111111111111111111111111111111 success',
      ],
      postBalances: [
        lamports(9877744n),
        lamports(2074080n),
        lamports(2074080n),
        lamports(1n),
        lamports(731913600n),
        lamports(1000000n),
        lamports(1n),
        lamports(18359024537n),
        lamports(1141440n),
      ],
      postTokenBalances: [
        {
          accountIndex: 1,
          mint: address('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'),
          owner: address('BYh4CfuGDvFMKaZp3RPmkw9y6qg3sWukA2TiGJDeLKZi'),
          programId: address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
          uiTokenAmount: {
            amount: '10000000' as StringifiedBigInt,
            decimals: 9,
            uiAmount: 0.01,
            uiAmountString: '0.01' as StringifiedNumber,
          },
        },
        {
          accountIndex: 2,
          mint: address('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'),
          owner: address('EMmTjuHsYCYX7vgPcQ2QVbNwYAwcvGoSMCEaHKc19DdE'),
          programId: address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
          uiTokenAmount: {
            amount: '0' as StringifiedBigInt,
            decimals: 9,
            uiAmount: null,
            uiAmountString: '0' as StringifiedNumber,
          },
        },
      ],
      preBalances: [
        lamports(11957046n),
        lamports(0n),
        lamports(2074080n),
        lamports(1n),
        lamports(731913600n),
        lamports(1000000n),
        lamports(1n),
        lamports(18359024537n),
        lamports(1141440n),
      ],
      preTokenBalances: [
        {
          accountIndex: 2,
          mint: address('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'),
          owner: address('EMmTjuHsYCYX7vgPcQ2QVbNwYAwcvGoSMCEaHKc19DdE'),
          programId: address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
          uiTokenAmount: {
            amount: '10000000' as StringifiedBigInt,
            decimals: 9,
            uiAmount: 0.01,
            uiAmountString: '0.01' as StringifiedNumber,
          },
        },
      ],
      rewards: [],
      status: {
        Ok: null,
      },
    },
    slot: 336671683n,
    transaction: {
      message: {
        accountKeys: [
          address('EMmTjuHsYCYX7vgPcQ2QVbNwYAwcvGoSMCEaHKc19DdE'),
          address('5k4KRS1HVR5DaQhPzY3P9mRBw1k3TK7fug23utRcqgk1'),
          address('BDAg5uPZ6ktjPZuKoktHLYbJLw6KqRTiHtJoeG9GDyLY'),
          address('11111111111111111111111111111111'),
          address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
          address('BYh4CfuGDvFMKaZp3RPmkw9y6qg3sWukA2TiGJDeLKZi'),
          address('ComputeBudget111111111111111111111111111111'),
          address('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'),
          address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
        ] as Address[],
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
            accounts: [0, 1, 5, 7, 3, 8],
            data: '2' as Base58EncodedBytes,
            programIdIndex: 4,
            stackHeight: null,
          },
          {
            accounts: [2, 1, 0],
            data: '3ay2hEw4e3yH' as Base58EncodedBytes,
            programIdIndex: 8,
            stackHeight: null,
          },
          {
            accounts: [],
            data: 'JPdU3Z' as Base58EncodedBytes,
            programIdIndex: 6,
            stackHeight: null,
          },
        ],
        recentBlockhash: blockhash(
          'GgifyvZfDFMQZmwmejZv7WuW7yWPFdo2jGrw2hb3Pba4',
        ),
      },
      signatures: [
        '4G24SgaZ3gU92HAB8xwSVg6WXS7NcGtUpHMnQ5RTwBw9bG5x8y6co5TzqqPXbExovY2NAuPjE9393TCHFZVhS8K9',
      ] as Base58EncodedBytes[],
    },
    version: 0 as TransactionVersion,
  };
