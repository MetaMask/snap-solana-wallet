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

const createMockGetRpc = () =>
  jest.fn().mockReturnValue({
    getBalance: createMockGetBalance(),
    getLatestBlockhash: createMockGetLatestBlockhash(),
    sendTransaction: createMockSendTransaction(),
  });

export const createMockConnection = (): SolanaConnection =>
  ({
    getRpc: createMockGetRpc(),
  } as unknown as SolanaConnection);
