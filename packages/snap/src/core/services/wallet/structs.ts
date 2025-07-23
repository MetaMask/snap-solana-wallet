import { SolMethod } from '@metamask/keyring-api';
import type { Infer } from '@metamask/superstruct';
import {
  array,
  boolean,
  coerce,
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

// Sanitizing structs that transform values during validation
const SanitizedSolanaAddressStruct = coerce(
  string(),
  string(),
  (value: string) => {
    if (!value || value === '') {
      throw new Error('Account address is required');
    }
    const sanitized = sanitizeSolanaAddress(value);
    if (sanitized === '') {
      throw new Error('Invalid Solana address format');
    }
    return sanitized;
  },
);

const WalletAccountStruct = type({
  address: SanitizedSolanaAddressStruct,
});

const SolanaSignatureTypeStruct = literal('ed25519');

// Sanitizing structs for SIWS fields
const SanitizedDomainStruct = coerce(string(), string(), (value: string) => {
  const sanitized = sanitizeDomain(value);
  if (sanitized === '') {
    throw new Error('Invalid domain format');
  }
  return sanitized;
});

const SanitizedAddressStruct = coerce(string(), string(), (value: string) => {
  const sanitized = sanitizeSolanaAddress(value);
  if (sanitized === '') {
    throw new Error('Invalid Solana address format');
  }
  return sanitized;
});

const SanitizedStatementStruct = coerce(string(), string(), (value: string) => {
  const sanitized = sanitizeForSignInMessage(value, 1000);
  if (sanitized === '') {
    throw new Error(
      'Statement cannot be empty. Control characters and excessive whitespace are removed for security. Please use plain text only.',
    );
  }
  return sanitized;
});

const SanitizedUriStruct = coerce(string(), string(), (value: string) => {
  return sanitizeUri(value);
});

const SanitizedVersionStruct = coerce(string(), string(), (value: string) => {
  return sanitizeForSignInMessage(value, 10);
});

const SanitizedChainIdStruct = coerce(string(), string(), (value: string) => {
  return sanitizeForSignInMessage(value, 50);
});

const SanitizedNonceStruct = coerce(string(), string(), (value: string) => {
  return sanitizeForSignInMessage(value, 100);
});

const SanitizedTimestampStruct = coerce(string(), string(), (value: string) => {
  return sanitizeTimestamp(value);
});

const SanitizedRequestIdStruct = coerce(string(), string(), (value: string) => {
  return sanitizeForSignInMessage(value, 100);
});

const SanitizedResourcesStruct = coerce(
  array(string()),
  array(string()),
  (value: string[]) => {
    const sanitized = sanitizeResources(value);

    return sanitized;
  },
);

const SolanaSignInInputStruct = type({
  domain: optional(SanitizedDomainStruct),
  address: optional(SanitizedAddressStruct),
  statement: optional(SanitizedStatementStruct),
  uri: optional(SanitizedUriStruct),
  version: optional(SanitizedVersionStruct),
  chainId: optional(SanitizedChainIdStruct),
  nonce: optional(SanitizedNonceStruct),
  issuedAt: optional(SanitizedTimestampStruct),
  expirationTime: optional(SanitizedTimestampStruct),
  notBefore: optional(SanitizedTimestampStruct),
  requestId: optional(SanitizedRequestIdStruct),
  resources: optional(SanitizedResourcesStruct),
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
