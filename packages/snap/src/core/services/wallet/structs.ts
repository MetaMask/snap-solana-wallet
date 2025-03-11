import { SolMethod } from '@metamask/keyring-api';
import type { Infer } from '@metamask/superstruct';
import {
  array,
  boolean,
  enums,
  literal,
  number,
  object,
  optional,
  string,
  type,
  union,
} from '@metamask/superstruct';

import { Network } from '../../constants/solana';

/**
 * Defines all structs derived from types defined in the Solana Wallet Standard.
 * Unfortunately the structs cannot be derived automatically from the types, so we need to manually define them.
 *
 * This will be used to validate incoming JSON-RPC requests that follow the Solana Wallet Standard.
 * @see https://github.com/anza-xyz/wallet-standard/tree/master/packages/core/features/src
 */

const ScopeStringStruct = enums(Object.values(Network));

const TransactionStruct = string();

const MessageStruct = string();

const WalletAccountStruct = type({
  address: string(),
});

const SolanaSignatureTypeStruct = literal('ed25519');

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
  message: MessageStruct,
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
  transaction: TransactionStruct,
  scope: ScopeStringStruct,
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
  scope: ScopeStringStruct,
  options: optional(SolanaSignAndSendTransactionOptionsStruct),
});

export const SolanaSignAndSendTransactionRequestStruct = object({
  method: enums([SolMethod.SignAndSendTransaction]),
  params: SolanaSignAndSendTransactionInputStruct,
});

export const SolanaSignInRequestStruct = object({
  method: enums([SolMethod.SignIn]),
  params: SolanaSignInInputStruct,
});

export const SolanaSignMessageRequestStruct = object({
  method: enums([SolMethod.SignMessage]),
  params: SolanaSignMessageInputStruct,
});

export const SolanaSignTransactionRequestStruct = object({
  method: enums([SolMethod.SignTransaction]),
  params: SolanaSignTransactionInputStruct,
});

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

export const SolanaSignAndSendTransactionResponseStruct = object({
  signature: TransactionStruct,
});

export type SolanaSignAndSendTransactionResponse = Infer<
  typeof SolanaSignAndSendTransactionResponseStruct
>;

export const SolanaSignTransactionResponseStruct = object({
  signedTransaction: TransactionStruct,
});

export type SolanaSignTransactionResponse = Infer<
  typeof SolanaSignTransactionResponseStruct
>;

export const SolanaSignMessageResponseStruct = object({
  /** The base58 encoded message signature. */
  signature: MessageStruct,
  /** The base58 encoded message. */
  signedMessage: MessageStruct,
  signatureType: SolanaSignatureTypeStruct,
});

export type SolanaSignMessageResponse = Infer<
  typeof SolanaSignMessageResponseStruct
>;

export const SolanaSignInResponseStruct = object({
  account: WalletAccountStruct,
  ...SolanaSignMessageResponseStruct.schema,
});

export type SolanaSignInResponse = Infer<typeof SolanaSignInResponseStruct>;

/**
 * Validates that a JsonRpcRequest is a valid Solana request.
 * @see https://github.com/MetaMask/accounts/blob/main/packages/keyring-api/docs/sol-methods.md
 */
export const SolanaWalletRequestStruct = union([
  SolanaSignAndSendTransactionRequestStruct,
  SolanaSignInRequestStruct,
  SolanaSignMessageRequestStruct,
  SolanaSignTransactionRequestStruct,
]);

export type SolanaWalletRequest = Infer<typeof SolanaWalletRequestStruct>;
