import type { ResolveAccountAddressRequest } from '@metamask/keyring-api';
import {
  KeyringRpcMethod,
  SolMethod,
  type KeyringRequest,
} from '@metamask/keyring-api';
import type { JsonRpcRequest } from '@metamask/utils';

import {
  MOCK_EXECUTION_SCENARIO_SEND_SOL,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
  Network,
} from '../../domain';
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
      transaction:
        MOCK_EXECUTION_SCENARIO_SEND_SOL.transactionMessageBase64Encoded,
      scope: Network.Localnet,
    },
  } as const;

export const MOCK_SIGN_AND_SEND_TRANSACTION_RESPONSE: SolanaSignAndSendTransactionResponse =
  {
    signature: MOCK_EXECUTION_SCENARIO_SEND_SOL.signature,
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
    transaction:
      MOCK_EXECUTION_SCENARIO_SEND_SOL.transactionMessageBase64Encoded,
    scope: Network.Localnet,
  },
};

export const MOCK_SIGN_TRANSACTION_RESPONSE: SolanaSignTransactionResponse = {
  signedTransaction:
    MOCK_EXECUTION_SCENARIO_SEND_SOL.signedTransactionBase64Encoded,
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
    domain: 'example.com',
    address: MOCK_SOLANA_KEYRING_ACCOUNT_2.address,
    statement: 'I accept the terms of service',
    uri: 'https://example.com/login',
    version: '1',
    chainId: 'solana:101',
    nonce: '32891756',
    issuedAt: '2024-01-01T00:00:00.000Z',
    expirationTime: '2024-01-02T00:00:00.000Z',
    notBefore: '2023-12-31T00:00:00.000Z',
    requestId: '123',
    resources: [
      'ipfs://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq/',
      'https://example.com/my-web2-claim.json',
    ],
  },
} as const;

export const MOCK_SIGN_IN_RESPONSE: SolanaSignInResponse = {
  account: {
    address: MOCK_SOLANA_KEYRING_ACCOUNT_2.address,
  },
  signature:
    '3SNumB7EXxEw8DbEXjYDKYMZRdGQb8CCrUL5cheTtkHk3arZA7mpvPw7PRT8vYMHzkmcPfrmdar1hofvFmb42rxS', // When signed by MOCK_SOLANA_KEYRING_ACCOUNT_2
  signedMessage:
    'ZXhhbXBsZS5jb20gd2FudHMgeW91IHRvIHNpZ24gaW4gd2l0aCB5b3VyIFNvbGFuYSBhY2NvdW50OgoyN2g2Y202UzlhZzV5NEFTaTFhMXZiVFNLRXNRTWpFZGZ2WjZhdFBqbWJ1RAoKSSBhY2NlcHQgdGhlIHRlcm1zIG9mIHNlcnZpY2UKClVSSTogaHR0cHM6Ly9leGFtcGxlLmNvbS9sb2dpbgpWZXJzaW9uOiAxCkNoYWluIElEOiBzb2xhbmE6MTAxCk5vbmNlOiAzMjg5MTc1NgpJc3N1ZWQgQXQ6IDIwMjQtMDEtMDFUMDA6MDA6MDAuMDAwWgpFeHBpcmF0aW9uIFRpbWU6IDIwMjQtMDEtMDJUMDA6MDA6MDAuMDAwWgpOb3QgQmVmb3JlOiAyMDIzLTEyLTMxVDAwOjAwOjAwLjAwMFoKUmVxdWVzdCBJRDogMTIzClJlc291cmNlczoKLSBpcGZzOi8vYmFmeWJlaWVteGY1YWJqd2piaWtvejRtYzNhM2RsYTZ1YWwzanNncGRyNGNqcjNvejNldmZ5YXZod3EvCi0gaHR0cHM6Ly9leGFtcGxlLmNvbS9teS13ZWIyLWNsYWltLmpzb24=', // MOCK_SIGN_IN_REQUEST.params that was formatted, then base64 encoded
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
