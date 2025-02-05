import {
  SignAndSendAllTransactions,
  SolanaSignAndSendTransaction,
  SolanaSignIn,
  SolanaSignMessage,
  SolanaSignTransaction,
} from '@solana/wallet-standard-core';
import type { Infer } from 'superstruct';
import {
  array,
  boolean,
  define,
  enums,
  number,
  object,
  optional,
  string,
  type,
  union,
} from 'superstruct';

/**
 * Defines all structs derived from types defined in the Solana Wallet Standard.
 * Unfortunately the structs cannot be derived automatically from the types, so we need to manually define them.
 *
 * This will be used to validate incoming JSON-RPC requests that follow the Solana Wallet Standard.
 * @see https://github.com/anza-xyz/wallet-standard/tree/master/packages/core/features/src
 */

const IdentifierStringStruct = string();

const IdentifierArrayStruct = array(IdentifierStringStruct);

const WalletIconStruct = string();

const ReadonlyUint8ArrayStruct = define<Uint8Array>(
  'ReadonlyUint8Array',
  (value) => value instanceof Uint8Array,
);

const WalletAccountStruct = type({
  address: string(),
  publicKey: ReadonlyUint8ArrayStruct,
  chains: IdentifierArrayStruct,
  features: IdentifierArrayStruct,
  label: optional(string()),
  icon: optional(WalletIconStruct),
});

const SolanaSignInInputStruct = type({
  domain: optional(string()),
  address: optional(string()),
  statement: optional(string()),
  uri: optional(string()),
  version: optional(string()),
  chainId: optional(string()),
  nonce: optional(string()),
  issuedAt: optional(string()),
  expirationTime: optional(string()),
  notBefore: optional(string()),
  requestId: optional(string()),
  resources: optional(array(string())),
});

const SolanaSignMessageInputStruct = type({
  account: WalletAccountStruct,
  message: ReadonlyUint8ArrayStruct,
});

const SolanaTransactionCommitmentStruct = enums([
  'processed',
  'confirmed',
  'finalized',
]);

const SolanaSignTransactionOptionsStruct = type({
  commitment: optional(SolanaTransactionCommitmentStruct),
});

const SolanaSignTransactionInputStruct = type({
  account: WalletAccountStruct,
  transaction: define<Uint8Array>(
    'Uint8Array',
    (value) => value instanceof Uint8Array,
  ),
  chain: optional(IdentifierStringStruct),
  options: optional(SolanaSignTransactionOptionsStruct),
});

const SolanaSignAndSendTransactionOptionsStruct = type({
  ...SolanaSignTransactionOptionsStruct.schema,
  commitment: optional(SolanaTransactionCommitmentStruct),
  skipPreflight: optional(boolean()),
  maxRetries: optional(number()),
});

const SolanaSignAndSendTransactionInputStruct = type({
  ...SolanaSignTransactionInputStruct.schema,
  chain: IdentifierStringStruct,
  options: optional(SolanaSignAndSendTransactionOptionsStruct),
});

const JsonRpcDefaultsStruct = object({
  id: number(),
  jsonrpc: string(),
});

export const SolanaSignAndSendAllTransactionsRequestStruct = object({
  ...JsonRpcDefaultsStruct.schema,
  method: enums([SignAndSendAllTransactions]),
  params: array(SolanaSignTransactionInputStruct),
});

export const SolanaSignAndSendTransactionRequestStruct = object({
  ...JsonRpcDefaultsStruct.schema,
  method: enums([SolanaSignAndSendTransaction]),
  params: SolanaSignAndSendTransactionInputStruct,
});

export const SolanaSignInRequestStruct = object({
  ...JsonRpcDefaultsStruct.schema,
  method: enums([SolanaSignIn]),
  params: SolanaSignInInputStruct,
});

export const SolanaSignMessageRequestStruct = object({
  ...JsonRpcDefaultsStruct.schema,
  method: enums([SolanaSignMessage]),
  params: SolanaSignMessageInputStruct,
});

export const SolanaSignTransactionRequestStruct = object({
  ...JsonRpcDefaultsStruct.schema,
  method: enums([SolanaSignTransaction]),
  params: SolanaSignTransactionInputStruct,
});

export type SolanaSignAndSendAllTransactionsRequest = Infer<
  typeof SolanaSignAndSendAllTransactionsRequestStruct
>;

export type SolanaSignAndSendTransactionRequest = Infer<
  typeof SolanaSignAndSendTransactionRequestStruct
>;

export type SolanaSignInRequest = Infer<typeof SolanaSignInRequestStruct>;

export type SolanaSignMessageRequest = Infer<
  typeof SolanaSignMessageRequestStruct
>;

export type SolanaSignTransactionRequest = Infer<
  typeof SolanaSignTransactionRequestStruct
>;

/**
 * Validates that a JsonRpcRequest is a valid Solana Wallet Standard request.
 * @see https://github.com/anza-xyz/wallet-standard/tree/master/packages/core/features/src
 */
export const SolanaWalletStandardRequestStruct = union([
  SolanaSignAndSendAllTransactionsRequestStruct,
  SolanaSignAndSendTransactionRequestStruct,
  SolanaSignInRequestStruct,
  SolanaSignMessageRequestStruct,
  SolanaSignTransactionRequestStruct,
]);

export type SolanaWalletStandardRequest = Infer<
  typeof SolanaWalletStandardRequestStruct
>;
