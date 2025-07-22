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
  refine,
} from '@metamask/superstruct';

import { Network } from '../../constants/solana';
import {
  sanitizeDomain,
  sanitizeSolanaAddress,
  sanitizeUri,
  sanitizeTimestamp,
  sanitizeForSignInMessage,
  sanitizeResources,
} from '../../utils/sanitize';
import { Base58Struct, Base64Struct } from '../../validation/structs';

/**
 * Defines all structs derived from types defined in the Solana Wallet Standard.
 * Unfortunately the structs cannot be derived automatically from the types, so we need to manually define them.
 *
 * This will be used to validate incoming JSON-RPC requests that follow the Solana Wallet Standard.
 * @see https://github.com/anza-xyz/wallet-standard/tree/master/packages/core/features/src
 */

const ScopeStringStruct = enums(Object.values(Network));

const WalletAccountStruct = type({
  address: string(),
});

const SolanaSignatureTypeStruct = literal('ed25519');

// Validation functions for SIWS fields that validate format when provided
const validateDomain = refine(string(), 'domain', (value) => {
  if (value === '') {
    return true;
  }
  sanitizeDomain(value);
  return true;
});

const validateAddress = refine(string(), 'address', (value) => {
  if (value === '') {
    return true;
  }
  sanitizeSolanaAddress(value);
  return true;
});

const validateStatement = refine(string(), 'statement', (value) => {
  if (value === '') {
    return true;
  }
  sanitizeForSignInMessage(value, 1000);
  return true;
});

const validateUri = refine(string(), 'uri', (value) => {
  if (value === '') {
    return true;
  }
  sanitizeUri(value);
  return true;
});

const validateVersion = refine(string(), 'version', (value) => {
  if (value === '') {
    return true;
  }
  sanitizeForSignInMessage(value, 10);
  return true;
});

const validateChainId = refine(string(), 'chainId', (value) => {
  if (value === '') {
    return true;
  }
  sanitizeForSignInMessage(value, 50);
  return true;
});

const validateNonce = refine(string(), 'nonce', (value) => {
  if (value === '') {
    return true;
  }
  sanitizeForSignInMessage(value, 100);
  return true;
});

const validateTimestamp = refine(string(), 'timestamp', (value) => {
  if (value === '') {
    return true;
  }
  sanitizeTimestamp(value);
  return true;
});

const validateRequestId = refine(string(), 'requestId', (value) => {
  if (value === '') {
    return true;
  }
  sanitizeForSignInMessage(value, 100);
  return true;
});

const validateResources = refine(array(string()), 'resources', (value) => {
  if (value.length === 0) {
    return true;
  }
  sanitizeResources(value);
  return true;
});

const SolanaSignInInputStruct = type({
  domain: optional(validateDomain),
  address: optional(validateAddress),
  statement: optional(validateStatement),
  uri: optional(validateUri),
  version: optional(validateVersion),
  chainId: optional(validateChainId),
  nonce: optional(validateNonce),
  issuedAt: optional(validateTimestamp),
  expirationTime: optional(validateTimestamp),
  notBefore: optional(validateTimestamp),
  requestId: optional(validateRequestId),
  resources: optional(validateResources),
});

const SolanaSignMessageInputStruct = type({
  account: WalletAccountStruct,
  message: Base64Struct,
});

const SolanaTransactionCommitmentStruct = enums([
  'processed',
  'confirmed',
  'finalized',
]);

const SolanaSignTransactionOptionsStruct = type({
  /** Preflight commitment level. */
  preflightCommitment: optional(SolanaTransactionCommitmentStruct),
  /** The minimum slot that the request can be evaluated at. */
  minContextSlot: optional(number()),
});

const SolanaSignTransactionInputStruct = type({
  account: WalletAccountStruct,
  transaction: Base64Struct,
  scope: ScopeStringStruct,
  options: optional(SolanaSignTransactionOptionsStruct),
});

const SolanaSignAndSendTransactionOptionsStruct = type({
  ...SolanaSignTransactionOptionsStruct.schema,
  /** Desired commitment level. If provided, confirm the transaction after sending. */
  commitment: optional(SolanaTransactionCommitmentStruct),
  /** Disable transaction verification at the RPC. */
  skipPreflight: optional(boolean()),
  /** Maximum number of times for the RPC node to retry sending the transaction to the leader. */
  maxRetries: optional(number()),
});

export type SolanaSignAndSendTransactionOptions = Infer<
  typeof SolanaSignAndSendTransactionOptionsStruct
>;

export const SolanaSignAndSendTransactionInputStruct = type({
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
  signature: Base58Struct,
});

export type SolanaSignAndSendTransactionResponse = Infer<
  typeof SolanaSignAndSendTransactionResponseStruct
>;

export const SolanaSignTransactionResponseStruct = object({
  /**
   * The whole signed transaction object, encoded in base64. It is NOT the signature.
   * Returning a transaction rather than signatures allows multisig wallets, program wallets, and other wallets that
   * use meta-transactions to return a modified, signed transaction.
   */
  signedTransaction: Base64Struct,
});

export type SolanaSignTransactionResponse = Infer<
  typeof SolanaSignTransactionResponseStruct
>;

export const SolanaSignMessageResponseStruct = object({
  signature: Base58Struct,
  signedMessage: Base64Struct,
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
