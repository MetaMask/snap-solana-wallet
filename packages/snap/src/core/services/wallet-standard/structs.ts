import { SolMethod } from '@metamask/keyring-api';
import type { Infer } from 'superstruct';
import {
  array,
  boolean,
  enums,
  number,
  object,
  optional,
  string,
  type,
  union,
} from 'superstruct';

import { Network } from '../../constants/solana';
import { SendAndConfirmTransactionParamsStruct } from '../../validation/structs';

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

const SolanaSignatureTypeStruct = enums(['ed25519']);

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

const JsonRpcDefaultsStruct = object({
  id: number(),
  jsonrpc: string(),
});

// TODO: Deprecate
export const SolanaSendAndConfirmTransactionRequestStruct = object({
  ...JsonRpcDefaultsStruct.schema,
  method: enums([SolMethod.SendAndConfirmTransaction]),
  params: SendAndConfirmTransactionParamsStruct,
});

export const SolanaSignAndSendTransactionRequestStruct = object({
  ...JsonRpcDefaultsStruct.schema,
  method: enums([SolMethod.SignAndSendTransaction]),
  params: SolanaSignAndSendTransactionInputStruct,
});

export const SolanaSignInRequestStruct = object({
  ...JsonRpcDefaultsStruct.schema,
  method: enums([SolMethod.SignIn]),
  params: SolanaSignInInputStruct,
});

export const SolanaSignMessageRequestStruct = object({
  ...JsonRpcDefaultsStruct.schema,
  method: enums([SolMethod.SignMessage]),
  params: SolanaSignMessageInputStruct,
});

export const SolanaSignTransactionRequestStruct = object({
  ...JsonRpcDefaultsStruct.schema,
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
  signature: MessageStruct,
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
 * Validates that a JsonRpcRequest is a valid Solana Wallet Standard request.
 * @see https://github.com/anza-xyz/wallet-standard/tree/master/packages/core/features/src
 */
export const SolanaWalletStandardRequestStruct = union([
  SolanaSignAndSendTransactionRequestStruct,
  SolanaSignInRequestStruct,
  SolanaSignMessageRequestStruct,
  SolanaSignTransactionRequestStruct,
]);

export type SolanaWalletStandardRequest = Infer<
  typeof SolanaWalletStandardRequestStruct
>;
