import { AssetStruct, FeeType } from '@metamask/keyring-api';
import { literal } from '@metamask/snaps-sdk';
import type { Infer } from '@metamask/superstruct';
import {
  array,
  boolean,
  defaulted,
  enums,
  is,
  object,
  optional,
  refine,
  string,
} from '@metamask/superstruct';
import {
  CaipAssetTypeStruct,
  JsonRpcIdStruct,
  JsonRpcVersionStruct,
} from '@metamask/utils';
import { getBase64Codec, getUtf8Codec, pipe } from '@solana/kit';

import { Network } from '../../constants/solana';
import { SendErrorCodes } from '../../services/send/types';
import {
  ScopeStringStruct,
  SolanaSignAndSendTransactionInputStruct,
  SolanaSignAndSendTransactionOptionsStruct,
} from '../../services/wallet/structs';
import {
  Base58Struct,
  Base64Struct,
  PositiveNumberStringStruct,
  SolanaAddressStruct,
  UuidStruct,
} from '../../validation/structs';
import { ClientRequestMethod } from './types';

/**
 * signAndSendTransactionWithoutConfirmation request/response validation.
 * TODO: Deprecate this method.
 */
export const SignAndSendTransactionWithoutConfirmationRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(
    ClientRequestMethod.SignAndSendTransactionWithoutConfirmation,
  ),
  params: SolanaSignAndSendTransactionInputStruct,
});

/**
 * signAndSendTransaction request/response validation.
 */
export const SignAndSendTransactionRequestParamsStruct = object({
  transaction: Base64Struct,
  accountId: UuidStruct,
  scope: ScopeStringStruct,
  options: optional(SolanaSignAndSendTransactionOptionsStruct),
});

export const SignAndSendTransactionRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(ClientRequestMethod.SignAndSendTransaction),
  params: SignAndSendTransactionRequestParamsStruct,
});

export const SignAndSendTransactionResponseStruct = object({
  transactionId: Base58Struct,
});

export type SignAndSendTransactionResponse = Infer<
  typeof SignAndSendTransactionResponseStruct
>;

/**
 * onConfirmSend request/response validation.
 */
export const OnConfirmSendRequestParamsStruct = object({
  fromAccountId: UuidStruct,
  toAddress: SolanaAddressStruct,
  amount: PositiveNumberStringStruct,
  assetId: CaipAssetTypeStruct,
});

export const OnConfirmSendRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(ClientRequestMethod.ConfirmSend),
  params: OnConfirmSendRequestParamsStruct,
});

/**
 * onAddressInput request/response validation.
 */
export const OnAddressInputRequestParamsStruct = object({
  value: string(),
  scope: defaulted(ScopeStringStruct, Network.Mainnet),
});

export const OnAddressInputRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(ClientRequestMethod.OnAddressInput),
  params: OnAddressInputRequestParamsStruct,
});

/**
 * onAmountInput request/response validation.
 */
export const OnAmountInputRequestParamsStruct = object({
  value: PositiveNumberStringStruct,
  accountId: UuidStruct,
  assetId: CaipAssetTypeStruct,
});

export const OnAmountInputRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(ClientRequestMethod.OnAmountInput),
  params: OnAmountInputRequestParamsStruct,
});

/**
 * Utility function to decode and parse a rewards message.
 * Returns the parsed components or throws an error if invalid.
 *
 * @param base64Message - The base64-encoded rewards message.
 * @returns Object containing the parsed address and timestamp.
 * @throws Error if the message format is invalid
 */
export function parseRewardsMessage(base64Message: string): {
  address: string;
  timestamp: number;
} {
  // Decode the message from base64 to utf8
  const decodedMessage = pipe(
    base64Message,
    getBase64Codec().encode, // From base64 to uint8Array
    getUtf8Codec().decode, // From uint8Array to utf8
  );

  // Check if message starts with 'rewards,'
  if (!decodedMessage.startsWith('rewards,')) {
    throw new Error('Message must start with "rewards,"');
  }

  // Split the message into parts
  const parts = decodedMessage.split(',');
  if (parts.length !== 3) {
    throw new Error(
      'Message must have exactly 3 parts: rewards,{address},{timestamp}',
    );
  }

  const [prefix, addressPart, timestampPart] = parts;

  // Validate prefix (already checked above, but being explicit)
  if (prefix !== 'rewards') {
    throw new Error('Message must start with "rewards"');
  }

  // Validate Solana address
  if (!is(addressPart, SolanaAddressStruct)) {
    throw new Error('Invalid Solana address');
  }

  // Validate timestamp
  if (!is(timestampPart, PositiveNumberStringStruct)) {
    throw new Error('Invalid timestamp format');
  }

  // Ensure timestamp is an integer (no decimals)
  if (timestampPart.includes('.')) {
    throw new Error('Invalid timestamp');
  }

  const timestamp = parseInt(timestampPart, 10);
  if (timestamp <= 0) {
    throw new Error('Invalid timestamp');
  }

  return {
    address: addressPart,
    timestamp,
  };
}

/**
 * Validates that a base64-encoded message follows the rewards format:
 * 'rewards,{address},{timestamp}'
 * - Must be valid base64
 * - When decoded, must start with 'rewards,'
 * - Must contain a valid Solana address
 * - Must contain a valid timestamp
 */
export const RewardsMessageStruct = refine(
  Base64Struct,
  'RewardsMessage',
  (value: string) => {
    try {
      parseRewardsMessage(value);
      return true;
    } catch (error) {
      return error instanceof Error ? error.message : 'Invalid rewards message';
    }
  },
);

export const SignRewardsMessageRequestParamsStruct = object({
  accountId: UuidStruct,
  message: RewardsMessageStruct,
});

export const SignRewardsMessageRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(ClientRequestMethod.SignRewardsMessage),
  params: SignRewardsMessageRequestParamsStruct,
});

/**
 * Utility function to decode and parse a card message.
 * The card message follows a SIWS (Sign-In with Solana) style format:
 * `{domain} wants you to sign in with your Solana account: {address} {statement} URI: {uri} Version: {version} Chain ID: {chainId} Nonce: {nonce} Issued At: {issuedAt} Expiration Time: {expirationTime}`
 *
 * @param base64Message - The base64-encoded card message.
 * @returns Object containing the parsed components.
 * @throws Error if the message format is invalid
 */
export function parseCardMessage(base64Message: string): {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
} {
  // Decode the message from base64 to utf8
  const decodedMessage = pipe(
    base64Message,
    getBase64Codec().encode, // From base64 to uint8Array
    getUtf8Codec().decode, // From uint8Array to utf8
  );

  // Parse the message using regex
  // Note: Nonce accepts alphanumeric characters to support various partner formats
  const regex =
    /^(.+) wants you to sign in with your Solana account: ([1-9A-HJ-NP-Za-km-z]{32,44}) (.+) URI: (.+) Version: (\d+) Chain ID: (\d+) Nonce: ([a-zA-Z0-9]+) Issued At: (.+) Expiration Time: (.+)$/u;

  const match = decodedMessage.match(regex);

  if (!match) {
    throw new Error(
      'Invalid card message format. Expected format: "{domain} wants you to sign in with your Solana account: {address} {statement} URI: {uri} Version: {version} Chain ID: {chainId} Nonce: {nonce} Issued At: {issuedAt} Expiration Time: {expirationTime}"',
    );
  }

  const [
    ,
    domain,
    addressPart,
    statement,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
    expirationTime,
  ] = match as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];

  // Validate domain
  if (!domain || domain.trim() === '') {
    throw new Error('Invalid domain in card message');
  }

  // Validate Solana address
  if (!is(addressPart, SolanaAddressStruct)) {
    throw new Error('Invalid Solana address in card message');
  }

  // Validate URI format
  try {
    const parsedUrl = new URL(uri);
    if (!parsedUrl.protocol) {
      throw new Error('Invalid URI');
    }
  } catch {
    throw new Error('Invalid URI in card message');
  }

  // Validate issuedAt is a valid ISO 8601 date
  const issuedAtDate = new Date(issuedAt);
  if (isNaN(issuedAtDate.getTime())) {
    throw new Error('Invalid Issued At date in card message');
  }

  // Validate expirationTime is a valid ISO 8601 date
  const expirationTimeDate = new Date(expirationTime);
  if (isNaN(expirationTimeDate.getTime())) {
    throw new Error('Invalid Expiration Time date in card message');
  }

  return {
    domain,
    address: addressPart,
    statement,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
    expirationTime,
  };
}

/**
 * Validates that a base64-encoded message follows the card message format (SIWS style).
 */
export const CardMessageStruct = refine(
  Base64Struct,
  'CardMessage',
  (value: string) => {
    try {
      parseCardMessage(value);
      return true;
    } catch (error) {
      return error instanceof Error ? error.message : 'Invalid card message';
    }
  },
);

/**
 * signCardMessage request/response validation.
 */
export const SignCardMessageRequestParamsStruct = object({
  accountId: UuidStruct,
  message: CardMessageStruct,
});

export const SignCardMessageRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(ClientRequestMethod.SignCardMessage),
  params: SignCardMessageRequestParamsStruct,
});

/**
 * approveCardAmount request/response validation.
 * This method creates a token approval (delegate) transaction on chain.
 */
export const ApproveCardAmountRequestParamsStruct = object({
  accountId: UuidStruct,
  amount: PositiveNumberStringStruct,
  mint: SolanaAddressStruct,
  delegate: SolanaAddressStruct,
  scope: ScopeStringStruct,
});

export const ApproveCardAmountRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(ClientRequestMethod.ApproveCardAmount),
  params: ApproveCardAmountRequestParamsStruct,
});

export const ApproveCardAmountResponseStruct = object({
  signature: Base58Struct,
});

export const ValidationResponseStruct = object({
  valid: boolean(),
  errors: array(
    object({
      code: enums(Object.values(SendErrorCodes)),
    }),
  ),
});

export type ValidationResponse = Infer<typeof ValidationResponseStruct>;

/**
 * computeFee request/response validation.
 */
export const ComputeFeeRequestParamsStruct = object({
  transaction: Base64Struct,
  accountId: UuidStruct,
  scope: ScopeStringStruct,
});

export const ComputeFeeRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(ClientRequestMethod.ComputeFee),
  params: ComputeFeeRequestParamsStruct,
});

export const ComputeFeeResponseStruct = array(
  object({
    type: enums(Object.values(FeeType)),
    asset: AssetStruct,
  }),
);

export type ComputeFeeResponse = Infer<typeof ComputeFeeResponseStruct>;
