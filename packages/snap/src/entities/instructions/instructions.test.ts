import { address, type Rpc, type SolanaRpcApi } from '@solana/kit';

import { MOCK_EXECUTION_SCENARIO_SEND_SPL_TOKEN } from '../../core/services/signer/mocks/scenarios/sendSplToken';
import { trackError } from '../../core/utils/errors';
import type { InstructionParseResult } from './instructions';
import {
  extractInstructionsFromUnknownBase64String,
  parseInstruction,
} from './instructions';

jest.mock('../../core/utils/errors', () => ({
  trackError: jest.fn().mockResolvedValue('tracked-error-id'),
}));

describe('extractInstructionsFromBase64String', () => {
  let mockRpc: Rpc<SolanaRpcApi>;

  const {
    transactionMessageBase64Encoded,
    signedTransactionBase64Encoded,
    getMultipleAccountsResponse,
  } = MOCK_EXECUTION_SCENARIO_SEND_SPL_TOKEN;

  const expectedInstructionParseResults: InstructionParseResult[] = [
    {
      type: 'SetComputeUnitLimit',
      encoded: {
        programAddress: address('ComputeBudget111111111111111111111111111111'),
        data: new Uint8Array([2, 186, 18, 0, 0]),
        dataBase58: 'JqvQNT',
      },
      parsed: {
        programAddress: address('ComputeBudget111111111111111111111111111111'),
        data: {
          discriminator: 2,
          units: 4794,
        },
      },
    },
    {
      type: 'SetComputeUnitPrice',
      encoded: {
        programAddress: address('ComputeBudget111111111111111111111111111111'),
        data: new Uint8Array([3, 232, 3, 0, 0, 0, 0, 0, 0]),
        dataBase58: '3tGNFMqHiozw',
      },
      parsed: {
        programAddress: address('ComputeBudget111111111111111111111111111111'),
        data: {
          discriminator: 3,
          microLamports: 1000n,
        },
      },
    },
    {
      type: 'Transfer',
      encoded: {
        programAddress: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        accounts: [
          {
            address: address('G23tQHsbQuh3yqUBoyXDn3TwqEbbbUHAHEeUSvJaVRtA'),
            role: 1,
          },
          {
            address: address('CSq2wNLSpfKHCdL3E3k1iksbRXWjfnD87b9iy35nL8VP'),
            role: 1,
          },
          {
            address: address('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
            role: 3,
          },
        ],
        data: new Uint8Array([3, 232, 3, 0, 0, 0, 0, 0, 0]),
        dataBase58: '3tGNFMqHiozw',
      },
      parsed: {
        programAddress: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        accounts: {
          source: {
            address: address('G23tQHsbQuh3yqUBoyXDn3TwqEbbbUHAHEeUSvJaVRtA'),
            role: 1,
          },
          destination: {
            address: address('CSq2wNLSpfKHCdL3E3k1iksbRXWjfnD87b9iy35nL8VP'),
            role: 1,
          },
          authority: {
            address: address('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
            role: 3,
          },
        },
        data: {
          discriminator: 3,
          amount: 1000n,
        },
      },
    },
  ] as unknown as InstructionParseResult[];

  beforeEach(() => {
    mockRpc = {
      getLatestBlockhash: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
      getFeeForMessage: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
      getMultipleAccounts: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue(getMultipleAccountsResponse?.result),
      }),
    } as unknown as Rpc<SolanaRpcApi>;
  });

  it(`successfully extracts instructions from a base64 encoded transaction message`, async () => {
    const result = await extractInstructionsFromUnknownBase64String(
      mockRpc,
      transactionMessageBase64Encoded,
    );

    expect(result).toStrictEqual(expectedInstructionParseResults);
  });

  it(`successfully extracts instructions from a base64 encoded transaction`, async () => {
    const result = await extractInstructionsFromUnknownBase64String(
      mockRpc,
      signedTransactionBase64Encoded,
    );

    expect(result).toStrictEqual(expectedInstructionParseResults);
  });

  it('tracks instruction parsing failures', () => {
    const result = parseInstruction({
      programAddress: address('11111111111111111111111111111112'),
      accounts: [],
      data: new Uint8Array([1, 2, 3]),
    } as any);

    expect(result).toStrictEqual({
      type: 'Unknown',
      encoded: expect.objectContaining({
        programAddress: address('11111111111111111111111111111112'),
        dataBase58: expect.any(String),
      }),
      parsed: null,
    });
    expect(trackError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Unsupported program address',
      }),
    );
  });
});
