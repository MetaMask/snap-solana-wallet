/* eslint-disable consistent-return */
import type { Json } from '@metamask/utils';
import express from 'express';

import logger from '../../utils/logger';
import { Stack } from '../../utils/stack';

export type MockedResolvedResult = {
  method: string;
  result: Json;
};

export type MockedRejectedError = {
  method: string;
  error: {
    code: number;
    message: string;
  };
};

export type MockSolanaRpc = {
  mockResolvedResult: (mock: MockedResolvedResult) => void;
  mockResolvedResultOnce: (mock: MockedResolvedResult) => void;
  mockRejectedError: (mock: MockedRejectedError) => void;
  mockRejectedErrorOnce: (mock: MockedRejectedError) => void;
  shutdown: () => void;
};

// Singleton server instance
const FIXED_PORT = 8899;
let app: express.Application | null = null;
let server: any;

/**
 * We store mocks in a Map where the key is the method name and the value is a
 * Stack of responses.
 *
 * The stack is a convenient data structure that allows us to mimick the
 * "Jest style syntax" with `mockResolvedResponseOnce` and `mockResolvedResponse`.
 *
 * Every call to `mockResolvedResponseOnce` adds an item to the stack.
 * Every call to `mockResolvedResponse` adds a NON DESTACKABLE item to the stack.
 *
 * Every time the mock responds, if the item is destackable, it is removed from
 * the stack. If the item is not destackable, it is returned without removing it
 * from the stack.
 */
const mocks = new Map<
  string,
  Stack<
    Omit<MockedResolvedResult, 'method'> | Omit<MockedRejectedError, 'method'>
  >
>();

/**
 * Singleton express app: creates it if it does not exist, otherwise returns
 * the existing one.
 */
const createAppIfNotExists = () => {
  if (!app) {
    app = express();
    app.use(express.json());

    app.post('/', (req: any, res: any) => {
      const { method, id: requestId } = req.body;
      const id = requestId ?? '0';

      const mockStack = mocks.get(method);
      if (!mockStack) {
        return res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'No mock registered for this method',
          },
        });
      }

      const mock = mockStack.pop();
      if (!mock) {
        return res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'No mock registered for this method',
          },
        });
      }

      if ('error' in mock) {
        return res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: mock.error,
        });
      }

      return res.json({
        jsonrpc: '2.0',
        id,
        result: mock.result,
      });
    });

    server = app.listen(FIXED_PORT);
    logger.info(`Mock Solana RPC listening on port ${FIXED_PORT}`);
  }
};

/**
 * Starts a mock Solana RPC server on local port 8899, and returns utility
 * methods to mock Solana RPC responses and errors.
 *
 * @returns An object with utility methods to mock Solana RPC responses and errors.
 * @example
 * ```ts
 * const { mockResolvedResult, mockRejectedError, shutdown } = startMockSolanaRpc();
 *
 * // Mock a resolved result once
 * mockResolvedResultOnce({ method: 'getBalance', result: { balance: 1000 } });
 * mockResolvedResultOnce({ method: 'getBalance', result: { balance: 2000 } });
 *
 * // Mock a rejected error
 * mockRejectedError({ method: 'sendTransaction', error: { code: -32000, message: 'Insufficient funds' } });
 * ```
 */
export const startMockSolanaRpc = (): MockSolanaRpc => {
  createAppIfNotExists();

  const mockResolvedResult = ({ method, result }: MockedResolvedResult) => {
    const stack = mocks.get(method) ?? new Stack();
    stack.push({ result }, false); // Non destackable
    mocks.set(method, stack);
  };

  const mockResolvedResultOnce = ({ method, result }: MockedResolvedResult) => {
    const stack = mocks.get(method) ?? new Stack();
    stack.push({ result }, true); // Destackable
    mocks.set(method, stack);
  };

  const mockRejectedError = ({ method, error }: MockedRejectedError) => {
    const stack = mocks.get(method) ?? new Stack();
    stack.push({ error }, false); // Non destackable
    mocks.set(method, stack);
  };

  const mockRejectedErrorOnce = ({ method, error }: MockedRejectedError) => {
    const stack = mocks.get(method) ?? new Stack();
    stack.push({ error }, true); // Destackable
    mocks.set(method, stack);
  };

  const shutdown = () => server.close();

  return {
    mockResolvedResult,
    mockResolvedResultOnce,
    mockRejectedError,
    mockRejectedErrorOnce,
    shutdown,
  };
};
