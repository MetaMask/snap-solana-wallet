import {
  SignAndSendAllTransactions,
  SolanaSignAndSendTransaction,
  SolanaSignIn,
  SolanaSignMessage,
  SolanaSignTransaction,
} from '@solana/wallet-standard-core';

import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
} from '../../test/mocks/solana-keyring-accounts';
import type {
  SolanaSignAndSendAllTransactionsRequest,
  SolanaSignAndSendTransactionRequest,
  SolanaSignInRequest,
  SolanaSignMessageRequest,
  SolanaSignTransactionRequest,
} from './structs';

export const MOCK_SIGN_AND_SEND_ALL_TRANSACTIONS_REQUEST: SolanaSignAndSendAllTransactionsRequest =
  {
    id: 1,
    jsonrpc: '2.0',
    method: SignAndSendAllTransactions,
    params: [
      {
        account: {
          address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
          publicKey: new Uint8Array(),
          chains: [],
          features: [],
        },
        transaction: new TextEncoder().encode('transaction-0'),
      },
    ],
  } as const;

export const MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST: SolanaSignAndSendTransactionRequest =
  {
    id: 1,
    jsonrpc: '2.0',
    method: SolanaSignAndSendTransaction,
    params: {
      account: {
        address: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
        publicKey: new TextEncoder().encode('public-key-1'),
        chains: [],
        features: [],
      },
      chain: 'solana:101',
      transaction: new TextEncoder().encode('transaction-0'),
    },
  } as const;

export const MOCK_SIGN_IN_REQUEST: SolanaSignInRequest = {
  id: 1,
  jsonrpc: '2.0',
  method: SolanaSignIn,
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
  id: 1,
  jsonrpc: '2.0',
  method: SolanaSignMessage,
  params: {
    account: {
      address: MOCK_SOLANA_KEYRING_ACCOUNT_3.address,
      publicKey: new Uint8Array(),
      chains: [],
      features: [],
    },
    message: new TextEncoder().encode('Hello, world!'),
  },
};

export const MOCK_SIGN_TRANSACTION_REQUEST: SolanaSignTransactionRequest = {
  id: 1,
  jsonrpc: '2.0',
  method: SolanaSignTransaction,
  params: {
    account: {
      address: MOCK_SOLANA_KEYRING_ACCOUNT_4.address,
      publicKey: new TextEncoder().encode('public-key-4'),
      chains: [],
      features: [],
    },
    transaction: new TextEncoder().encode('transaction-1'),
  },
};
