import type {
  Address,
  Base58EncodedBytes,
  Base64EncodedDataResponse,
  Blockhash,
  Lamports,
  Reward,
  Slot,
  TokenBalance,
  TransactionError,
  TransactionVersion,
  UnixTimestamp,
} from '@solana/web3.js';

import type { SolanaTokenMetadata } from '../clients/token-metadata-client/types';
import type { SolanaCaip2Networks } from '../constants/solana';

export type SolanaAsset = {
  scope: SolanaCaip2Networks;
  address: string;
  balance: string;
  decimals: number;
  native: boolean;
  metadata?: SolanaTokenMetadata;
};

export type SolanaInstruction = {
  accounts: readonly number[];
  data: Base58EncodedBytes;
  programIdIndex: number;
  stackHeight?: number | null;
};

export type SolanaTransaction = {
  blockTime: UnixTimestamp | null;
  meta: {
    computeUnitsConsumed?: bigint | null;
    // eslint-disable-next-line id-denylist
    err: TransactionError | null;
    fee: Lamports;
    logMessages: readonly string[] | null;
    postBalances: readonly Lamports[];
    postTokenBalances?: readonly TokenBalance[];
    preBalances: readonly Lamports[];
    preTokenBalances?: readonly TokenBalance[];
    returnData?: {
      data: Base64EncodedDataResponse;
      programId: Address;
    };
    rewards: readonly Reward[] | null;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    status: { Ok: any } | { Err: TransactionError };
    innerInstructions?:
      | readonly {
          index: number;
          instructions: readonly {
            accounts: readonly number[];
            data: Base58EncodedBytes;
            programIdIndex: number;
            stackHeight?: number;
          }[];
        }[]
      | null;
    loadedAddresses?: {
      readonly: readonly Address[];
      writable: readonly Address[];
    };
  } | null;
  slot: Slot;
  transaction: {
    message: {
      accountKeys: readonly Address[];
      addressTableLookups?: readonly {
        accountKey: Address;
        readableIndexes: readonly number[];
        writableIndexes: readonly number[];
      }[];
      header: {
        numReadonlySignedAccounts: number;
        numReadonlyUnsignedAccounts: number;
        numRequiredSignatures: number;
      };
      instructions: readonly SolanaInstruction[];
      recentBlockhash: Blockhash;
    };
    signatures: readonly Base58EncodedBytes[];
  };
  version?: TransactionVersion | null;
};
