import type { ResolveAccountAddressRequest } from '@metamask/keyring-api';
import {
  KeyringRpcMethod,
  SolMethod,
  type KeyringRequest,
} from '@metamask/keyring-api';
import type { JsonRpcRequest } from '@metamask/utils';

import { Network } from '../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
} from '../../test/mocks/solana-keyring-accounts';
import type {
  SolanaSignAndSendTransactionRequest,
  SolanaSignAndSendTransactionResponse,
  SolanaSignInRequest,
  SolanaSignInResponse,
  SolanaSignMessageRequest,
  SolanaSignMessageResponse,
  SolanaSignTransactionRequest,
  SolanaSignTransactionResponse,
} from './structs';

export const wrapKeyringRequest = <Request extends KeyringRequest['request']>(
  request: Request,
): KeyringRequest =>
  ({
    id: '1',
    request,
    account: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
    scope: Network.Localnet,
  } as const);

/**
 * signAndSendTransaction
 */

export const MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST: SolanaSignAndSendTransactionRequest =
  {
    method: SolMethod.SignAndSendTransaction,
    params: {
      account: {
        address: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
      },
      transaction: 'VHJhbnNhY3Rpb24gMA==', // "Transaction 0" in base64
      scope: Network.Localnet,
    },
  } as const;

export const MOCK_SIGN_AND_SEND_TRANSACTION_RESPONSE: SolanaSignAndSendTransactionResponse =
  {
    signature:
      '5KZbqHxgKvXrQdHZA2WkVqhM9Z255ke3xqKe7z2QM4ufKrVuMw8P3bRz6FJWmGqHnJQr4hfXRJCxcQMnPBsCe6j4',
  } as const;

/**
 * signTransaction
 */

export const MOCK_SIGN_TRANSACTION_REQUEST: SolanaSignTransactionRequest = {
  method: SolMethod.SignTransaction,
  params: {
    account: {
      address: MOCK_SOLANA_KEYRING_ACCOUNT_4.address,
    },
    transaction: 'VHJhbnNhY3Rpb24gMQ==', // "Transaction 1" in base64
    scope: Network.Localnet,
  },
};

export const MOCK_SIGN_TRANSACTION_RESPONSE: SolanaSignTransactionResponse = {
  signedTransaction: MOCK_SIGN_TRANSACTION_REQUEST.params.transaction,
} as const;

/**
 * signMessage
 */

export const MOCK_SIGN_MESSAGE_REQUEST: SolanaSignMessageRequest = {
  method: SolMethod.SignMessage,
  params: {
    account: {
      address: MOCK_SOLANA_KEYRING_ACCOUNT_3.address,
    },
    message: 'SGVsbG8sIHdvcmxkIQ==', // "Hello, world!" in base64
  },
};

export const MOCK_SIGN_MESSAGE_RESPONSE: SolanaSignMessageResponse = {
  signature:
    '2n1rfebBmxvRd6MMdDdV5V9Hyy34FRBgVc6EFGjH78fNUW2Fz6RgkMwpHwLGFVQS2BBDkHV38FuKdavSF2GTo5gq', // When signed by MOCK_SOLANA_KEYRING_ACCOUNT_3
  signedMessage: 'SGVsbG8sIHdvcmxkIQ==', // "Hello, world!" in base64
  signatureType: 'ed25519',
} as const;

/**
 * signIn
 */

export const MOCK_SIGN_IN_REQUEST: SolanaSignInRequest = {
  method: SolMethod.SignIn,
  params: {
    address: MOCK_SOLANA_KEYRING_ACCOUNT_2.address,
    domain: 'example.com',
    statement: 'I accept the terms of service',
    uri: 'https://example.com',
    version: '1',
    chainId: 'solana:101',
    nonce: '123',
  },
} as const;

export const MOCK_SIGN_IN_RESPONSE: SolanaSignInResponse = {
  account: {
    address: MOCK_SOLANA_KEYRING_ACCOUNT_2.address,
  },
  signature:
    '3WiRaNnVAbrYWd4MT7rkq8oBC52HrbLZDst1K2ErAUiXswJu9aBZUMgKZpm581VV8Df6BDmgYGLRP7GcWE8mxMD9', // When signed by MOCK_SOLANA_KEYRING_ACCOUNT_2
  signedMessage:
    'eyJhZGRyZXNzIjoiMjdoNmNtNlM5YWc1eTRBU2kxYTF2YlRTS0VzUU1qRWRmdlo2YXRQam1idUQiLCJkb21haW4iOiJleGFtcGxlLmNvbSIsInN0YXRlbWVudCI6IkkgYWNjZXB0IHRoZSB0ZXJtcyBvZiBzZXJ2aWNlIiwidXJpIjoiaHR0cHM6Ly9leGFtcGxlLmNvbSIsInZlcnNpb24iOiIxIiwiY2hhaW5JZCI6InNvbGFuYToxMDEiLCJub25jZSI6IjEyMyJ9', // MOCK_SIGN_IN_REQUEST.params that was JSON.stringified, then base64 encoded
  signatureType: 'ed25519',
} as const;

/**
 * resolveAccountAddress
 */

export const MOCK_RESOLVE_ACCOUNT_ADDRESS_REQUEST: ResolveAccountAddressRequest =
  {
    id: 1,
    jsonrpc: '2.0',
    method: KeyringRpcMethod.ResolveAccountAddress,
    params: {
      request: {
        id: 1,
        jsonrpc: '2.0',
        ...MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST,
      } as unknown as JsonRpcRequest,
      scope: Network.Testnet,
    },
  };
