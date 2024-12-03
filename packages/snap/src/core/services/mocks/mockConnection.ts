import type { SolanaConnection } from '../connection/SolanaConnection';
import {
  MOCK_SOLANA_RPC_GET_BALANCE_RESPONSE,
  MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_RESPONSE,
  MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE,
} from './mockSolanaRpcResponses';

const createMockGetBalance = () =>
  jest.fn().mockReturnValue({
    send: jest
      .fn()
      .mockReturnValue(MOCK_SOLANA_RPC_GET_BALANCE_RESPONSE.result),
  });

const createMockGetLatestBlockhash = () =>
  jest.fn().mockReturnValue({
    send: jest
      .fn()
      .mockReturnValue(MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_RESPONSE.result),
  });

const createMockSendTransaction = () =>
  jest.fn().mockReturnValue({
    send: jest
      .fn()
      .mockReturnValue(MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE.result),
  });

const createMockGetSignaturesForAddress = () =>
  jest.fn().mockReturnValue({
    send: jest.fn().mockReturnValue([]),
  });

const createMockGetTransaction = () =>
  jest.fn().mockReturnValue({
    send: jest.fn().mockReturnValue({
      result: {
        signature: '123',
      },
    }),
  });

const createMockGetRpc = () =>
  jest.fn().mockReturnValue({
    getBalance: createMockGetBalance(),
    getLatestBlockhash: createMockGetLatestBlockhash(),
    sendTransaction: createMockSendTransaction(),
    getSignaturesForAddress: createMockGetSignaturesForAddress(),
    getTransaction: createMockGetTransaction(),
  });

export const createMockConnection = (): SolanaConnection =>
  ({
    getRpc: createMockGetRpc(),
  } as unknown as SolanaConnection);
