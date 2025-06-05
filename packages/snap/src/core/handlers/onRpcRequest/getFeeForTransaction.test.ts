import { installSnap } from '@metamask/snaps-jest';

import { Network } from '../../domain';
import { MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE } from '../../services/mocks/mockSolanaRpcResponses';
import type { MockSolanaRpc } from '../../test/mocks';
import { startMockSolanaRpc } from '../../test/mocks';
import { TEST_ORIGIN } from '../../test/utils';
import { RpcRequestMethod } from './types';

describe('getFeeForTransaction', () => {
  let mockSolanaRpc: MockSolanaRpc;

  beforeAll(() => {
    mockSolanaRpc = startMockSolanaRpc();
  });

  afterAll(() => {
    mockSolanaRpc.shutdown();
  });

  it('returns the fee for a transaction', async () => {
    const { mockResolvedResult } = mockSolanaRpc;

    mockResolvedResult({
      method: 'getFeeForMessage',
      result: MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE.result,
    });

    const { request } = await installSnap();

    const response = request({
      origin: TEST_ORIGIN,
      method: RpcRequestMethod.GetFeeForTransaction,
      params: {
        transaction: MOCK_VALID_SWAP_TRANSACTION,
        scope: Network.Localnet,
      },
    });

    const result = await response;

    expect(result).toMatchObject({
      id: expect.any(String),
      notifications: [],
      response: {
        result: {
          value: '15000',
        },
      },
    });
  });

  it('returns an error if transaction is not passed', async () => {
    const { request } = await installSnap();

    const response = request({
      origin: TEST_ORIGIN,
      method: RpcRequestMethod.GetFeeForTransaction,
      params: {
        scope: Network.Localnet,
      },
    });

    const result = await response;

    expect(result).toMatchObject({
      id: expect.any(String),
      notifications: [],
      response: {
        error: {
          message: expect.stringMatching(/At path: transaction/u),
        },
      },
    });
  });

  it('returns an error if transaction cannot be decoded', async () => {
    const { request } = await installSnap();

    const response = request({
      origin: TEST_ORIGIN,
      method: RpcRequestMethod.GetFeeForTransaction,
      params: {
        transaction: 'not-a-transaction',
        scope: Network.Localnet,
      },
    });

    const result = await response;

    expect(result).toMatchObject({
      id: expect.any(String),
      notifications: [],
      response: {
        error: {
          message: 'Internal JSON-RPC error.',
        },
      },
    });
  });
});
