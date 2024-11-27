/* eslint-disable consistent-return */
import express from 'express';

import logger from '../logger';

export type MockedResolvedResponse = {
  method: string;
  response: object;
};

// type MockedRejectedError = {
//   method: string;
//   error?: {
//     code: number;
//     message: string;/
//   };
// };

export type MockSolanaRpc = {
  mockResolvedResponse: (response: MockedResolvedResponse) => void;
  shutdown: () => void;
};

// Singleton server instance
const FIXED_PORT = 8899;
let app: express.Application | null = null;
let server: any;
const mocks = new Map<string, object>();

const createAppIfNotExists = () => {
  if (!app) {
    app = express();
    app.use(express.json());

    app.post('/', (req: any, res: any) => {
      console.log('💜💜💜💜💜req.body', req.body);
      const { method } = req.body;

      const mockResponse = mocks.get(method);

      if (!mockResponse) {
        return res.status(400).json({
          error: {
            code: -32601,
            message: 'No mock registered for this method',
          },
        });
      }

      res.json(mockResponse);
    });

    server = app.listen(FIXED_PORT);
    logger.info(`Mock Solana RPC listening on port ${FIXED_PORT}`);
  }
};

export const startMockSolanaRpc = (): MockSolanaRpc => {
  createAppIfNotExists();

  const mockResolvedResponse = ({
    method,
    response,
  }: MockedResolvedResponse) => {
    mocks.set(method, response);
  };

  //   const mockRejectedError = (
  //     testId: string,
  //     { method, error }: MockedRejectedError,
  //   ) => {
  //     const mocksForTestId = mocks.get(testId) ?? new Map();
  //     mocksForTestId.set(method, {
  //       error: error ?? { code: -32603, message: 'Internal error' },
  //     });
  //     mocks.set(testId, mocksForTestId);
  //   };

  const shutdown = () => server.close();

  return {
    mockResolvedResponse,
    // mockRejectedError,
    shutdown,
  };
};
