import type { Base58EncodedBytes, Slot, UnixTimestamp } from '@solana/web3.js';
import { address, blockhash, lamports } from '@solana/web3.js';

import type { SolanaTransaction } from '../../../types/solana';

/**
 * Devnet - Native SOL Transfer
 * Transaction: 2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6
 *
 * Senders:
 * BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP sends 0.1 SOL - OK
 *
 * Receivers:
 * FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK gets 0.1 SOL - OK
 */
export const EXPECTED_NATIVE_SOL_TRANSFER_DATA: SolanaTransaction = {
  blockTime: 1736500242n as UnixTimestamp,
  meta: {
    computeUnitsConsumed: 150n,
    // eslint-disable-next-line id-denylist
    err: null,
    fee: lamports(5000n),
    innerInstructions: [],
    loadedAddresses: { readonly: [], writable: [] },
    logMessages: [
      'Program 11111111111111111111111111111111 invoke [1]',
      'Program 11111111111111111111111111111111 success',
    ],
    postBalances: [lamports(3283865040n), lamports(100000000n), lamports(1n)],
    postTokenBalances: [],
    preBalances: [lamports(3383870040n), lamports(0n), lamports(1n)],
    preTokenBalances: [],
    rewards: [],
    status: { Ok: null },
  },
  slot: 353101424n as Slot,
  transaction: {
    message: {
      accountKeys: [
        address('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        address('FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK'),
        address('11111111111111111111111111111111'),
      ],
      addressTableLookups: [],
      header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 1,
        numRequiredSignatures: 1,
      },
      instructions: [
        {
          accounts: [0, 1],
          data: '3Bxs411Dtc7pkFQj' as Base58EncodedBytes,
          programIdIndex: 2,
          stackHeight: null,
        },
      ],
      recentBlockhash: blockhash(
        'Dd2KFRayr2fPNAKnKUuB6cSqEi4YSRhUPgG2BfaDTiLL',
      ),
    },
    signatures: [
      '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
    ] as Base58EncodedBytes[],
  },
  version: 0,
};
