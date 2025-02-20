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

export const MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST: SolanaSignAndSendTransactionRequest =
  {
    method: SolMethod.SignAndSendTransaction,
    params: {
      account: {
        address: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
      },
      transaction: 'transaction-0',
      scope: Network.Localnet,
    },
  } as const;

export const MOCK_SIGN_TRANSACTION_REQUEST: SolanaSignTransactionRequest = {
  method: SolMethod.SignTransaction,
  params: {
    account: {
      address: MOCK_SOLANA_KEYRING_ACCOUNT_4.address,
    },
    transaction: 'transaction-1',
    scope: Network.Localnet,
  },
};

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

export const MOCK_SIGN_MESSAGE_REQUEST: SolanaSignMessageRequest = {
  method: SolMethod.SignMessage,
  params: {
    account: {
      address: MOCK_SOLANA_KEYRING_ACCOUNT_3.address,
    },
    message: 'Hello, world!',
  },
};

export const MOCK_SIGN_TRANSACTION_RESPONSE: SolanaSignTransactionResponse = {
  signedTransaction: MOCK_SIGN_TRANSACTION_REQUEST.params.transaction,
} as const;

export const MOCK_SIGN_AND_SEND_TRANSACTION_RESPONSE: SolanaSignAndSendTransactionResponse =
  {
    signature: MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST.params.transaction,
  } as const;

export const MOCK_SIGN_MESSAGE_RESPONSE: SolanaSignMessageResponse = {
  signature: MOCK_SIGN_MESSAGE_REQUEST.params.message,
  signedMessage: MOCK_SIGN_MESSAGE_REQUEST.params.message,
  signatureType: 'ed25519',
} as const;

const { address, ...params } = MOCK_SIGN_IN_REQUEST.params;

export const MOCK_SIGN_IN_RESPONSE: SolanaSignInResponse = {
  account: {
    address: MOCK_SOLANA_KEYRING_ACCOUNT_2.address,
  },
  signature: 'mock-signature',
  signedMessage: Object.values(params).join(' | '),
  signatureType: 'ed25519',
} as const;

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
