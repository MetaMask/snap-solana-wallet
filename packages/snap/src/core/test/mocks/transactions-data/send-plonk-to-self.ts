import type { Base58EncodedBytes } from '@solana/kit';
import {
  address,
  blockhash,
  lamports,
  stringifiedBigInt,
  stringifiedNumber,
  unixTimestamp,
} from '@solana/kit';

import type { SolanaTransaction } from '../../../types/solana';

/**
 * Actual mainnet transaction where user sends 36 PLONK tokens to self.
 */
export const SEND_PLONK_TO_SELF: SolanaTransaction = {
  blockTime: unixTimestamp(1756366325n),
  meta: {
    computeUnitsConsumed: 16514n,
    // eslint-disable-next-line id-denylist
    err: null,
    fee: lamports(5400n),
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
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
      'Program log: CreateIdempotent',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 10338 of 39700 compute units',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
      'Program log: Instruction: TransferChecked',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 5876 of 29362 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    ],
    postBalances: [
      lamports(55684784n),
      lamports(2039280n),
      lamports(1n),
      lamports(747821958n),
      lamports(1n),
      lamports(7782328581n),
      lamports(4575972223n),
    ],
    postTokenBalances: [
      {
        accountIndex: 1,
        mint: address('HeqCcMjmuV5s25J49YiJyT6bD5qWLkP88YPajBySniaV'),
        owner: address('8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: stringifiedBigInt('18206064911813'),
          decimals: 5,
          uiAmount: 182060649.11813,
          uiAmountString: stringifiedNumber('182060649.11813'),
        },
      },
    ],
    preBalances: [
      lamports(55690184n),
      lamports(2039280n),
      lamports(1n),
      lamports(747821958n),
      lamports(1n),
      lamports(7782328581n),
      lamports(4575972223n),
    ],
    preTokenBalances: [
      {
        accountIndex: 1,
        mint: address('HeqCcMjmuV5s25J49YiJyT6bD5qWLkP88YPajBySniaV'),
        owner: address('8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC'),
        programId: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        uiTokenAmount: {
          amount: stringifiedBigInt('18206064911813'),
          decimals: 5,
          uiAmount: 182060649.11813,
          uiAmountString: stringifiedNumber('182060649.11813'),
        },
      },
    ],
    rewards: [],
    status: {
      Ok: null,
    },
  },
  slot: 363027026n,
  transaction: {
    message: {
      accountKeys: [
        address('8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC'),
        address('9gsXphsNFyuTZ4P1gfxQEJJb8LjZUmNFJuWB2EWK9pB7'),
        address('11111111111111111111111111111111'),
        address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
        address('ComputeBudget111111111111111111111111111111'),
        address('HeqCcMjmuV5s25J49YiJyT6bD5qWLkP88YPajBySniaV'),
        address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      ],
      addressTableLookups: [],
      header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 5,
        numRequiredSignatures: 1,
      },
      instructions: [
        {
          accounts: [],
          data: 'FjrGSs' as Base58EncodedBytes,
          programIdIndex: 4,
          stackHeight: null,
        },
        {
          accounts: [],
          data: '3GAG5eogvTjV' as Base58EncodedBytes,
          programIdIndex: 4,
          stackHeight: null,
        },
        {
          accounts: [0, 1, 0, 5, 2, 6],
          data: '2' as Base58EncodedBytes,
          programIdIndex: 3,
          stackHeight: null,
        },
        {
          accounts: [1, 5, 1, 0],
          data: 'hk8g7jZzuCnck' as Base58EncodedBytes,
          programIdIndex: 6,
          stackHeight: null,
        },
      ],
      recentBlockhash: blockhash(
        'CKTr1insPppD3sDtDwDibGJhY3uMNwMiLTFABdqjAA6D',
      ),
    },
    signatures: [
      '4uDwB51U8Bp4j76ezUrgiP9rYR64QwmqsgMu8d63nXRmTddjYAKQ5Zs9aN1VoNGuNyzyFbMDJ3Gp4DirJds4yXzq' as Base58EncodedBytes,
    ],
  },
  version: 0,
};
