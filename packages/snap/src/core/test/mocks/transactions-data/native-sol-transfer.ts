import type {
  Base58EncodedBytes,
  Blockhash,
  Lamports,
  Slot,
  UnixTimestamp,
} from '@solana/web3.js';
import { address as asAddress } from '@solana/web3.js';

import type { SolanaTransaction } from '../../../types/solana';

/**
 * Devnet - Native SOL Transfer
 * Transaction: 3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV
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
    fee: 5000n as Lamports,
    innerInstructions: [],
    loadedAddresses: { readonly: [], writable: [] },
    logMessages: [
      'Program 11111111111111111111111111111111 invoke [1]',
      'Program 11111111111111111111111111111111 success',
    ],
    postBalances: [3283865040n, 100000000n, 1n] as Lamports[],
    postTokenBalances: [],
    preBalances: [3383870040n, 0n, 1n] as Lamports[],
    preTokenBalances: [],
    rewards: [],
    status: { Ok: null },
  },
  slot: 353101424n as Slot,
  transaction: {
    message: {
      accountKeys: [
        asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        asAddress('FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK'),
        asAddress('11111111111111111111111111111111'),
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
      recentBlockhash:
        'Dd2KFRayr2fPNAKnKUuB6cSqEi4YSRhUPgG2BfaDTiLL' as Blockhash,
    },
    signatures: [
      '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
    ] as Base58EncodedBytes[],
  },
  version: 0,
};
