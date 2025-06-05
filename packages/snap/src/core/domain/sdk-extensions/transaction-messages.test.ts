/* eslint-disable @typescript-eslint/naming-convention */
import type { Rpc, SimulateTransactionApi } from '@solana/kit';
import {
  address,
  blockhash,
  getComputeUnitEstimateForTransactionMessageFactory,
  SolanaError,
} from '@solana/kit';

import { createMockConnection } from '../../services/mocks/mockConnection';
import { Network } from '../constants';
import {
  estimateAndOverrideComputeUnitLimit,
  isComputeUnitLimitInstruction,
  isComputeUnitPriceInstruction,
  isTransactionMessageWithComputeUnitLimitInstruction,
  isTransactionMessageWithComputeUnitPriceInstruction,
  isTransactionMessageWithFeePayer,
  setComputeUnitLimitInstructionIfMissing,
  setComputeUnitPriceInstructionIfMissing,
  setTransactionMessageFeePayerIfMissing,
  setTransactionMessageLifetimeUsingBlockhashIfMissing,
} from './transaction-messages';

jest.mock('@solana/kit', () => ({
  ...jest.requireActual('@solana/kit'),
  getComputeUnitEstimateForTransactionMessageFactory: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(500)), // 500 compute units
}));

describe('transaction-messages', () => {
  let rpc: Rpc<SimulateTransactionApi>;

  beforeEach(() => {
    const mockConnection = createMockConnection();
    rpc = mockConnection.getRpc(Network.Testnet);
  });

  describe('isTransactionMessageWithFeePayer', () => {
    it('returns true if the transaction message has a fee payer', () => {
      const transactionMessage = {
        version: 0 as const,
        instructions: [],
        feePayer: {
          address: address('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        },
      };

      expect(isTransactionMessageWithFeePayer(transactionMessage)).toBe(true);
    });

    it('returns false if the transaction message does not have a fee payer', () => {
      const transactionMessage = {
        version: 0 as const,
        instructions: [],
      };

      expect(isTransactionMessageWithFeePayer(transactionMessage)).toBe(false);
    });
  });

  describe('setTransactionMessageFeePayerIfMissing', () => {
    it('sets the fee payer if it is missing', () => {
      const transactionMessage = {
        version: 0 as const,
        instructions: [],
      };
      const feePayer = address('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP');

      const result = setTransactionMessageFeePayerIfMissing(
        feePayer,
        transactionMessage,
      );

      expect(result).toStrictEqual({
        version: 0 as const,
        instructions: [],
        feePayer: {
          address: feePayer,
        },
      });
    });

    it('does not set the fee payer if it is already present', () => {
      const transactionMessage = {
        version: 0 as const,
        instructions: [],
        feePayer: {
          address: address('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        },
      };
      const feePayerWontBeSet = address(
        'FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo',
      );

      const result = setTransactionMessageFeePayerIfMissing(
        feePayerWontBeSet,
        transactionMessage,
      );

      expect(result).toStrictEqual(transactionMessage);
    });
  });

  describe('setTransactionMessageLifetimeUsingBlockhashIfMissing', () => {
    it('sets the lifetime using blockhash if it is missing', () => {
      const transactionMessage = {
        version: 0 as const,
        instructions: [],
      };
      const lifetimeConstraint = {
        blockhash: blockhash('59ArZcTrPbcFbEt7yU1JRrP8bWT6ZGcCMLiDVLLzYZ3m'),
        lastValidBlockHeight: 18446744073709551615n,
      };

      const result = setTransactionMessageLifetimeUsingBlockhashIfMissing(
        lifetimeConstraint,
        transactionMessage,
      );

      expect(result).toStrictEqual({
        version: 0 as const,
        instructions: [],
        lifetimeConstraint,
      });
    });

    it('does not set the lifetime if it is already present', () => {
      const transactionMessage = {
        version: 0 as const,
        instructions: [],
        lifetimeConstraint: {
          blockhash: blockhash('59ArZcTrPbcFbEt7yU1JRrP8bWT6ZGcCMLiDVLLzYZ3m'),
          lastValidBlockHeight: 18446744073709551615n,
        },
      };
      const lifetimeConstraintWontBeSet = {
        blockhash: blockhash('8vMXV3ERvs12BY8w1nSHutzwwMptAR5UvUSq5pH2QYsK'),
        lastValidBlockHeight: 18446744073709551615n,
      };

      const result = setTransactionMessageLifetimeUsingBlockhashIfMissing(
        lifetimeConstraintWontBeSet,
        transactionMessage,
      );

      expect(result).toStrictEqual(transactionMessage);
    });
  });

  describe('isComputeUnitPriceInstruction', () => {
    it('returns true if the instruction is a compute unit price instruction', () => {
      // Is a compute unit price instruction because program address is the compute budget program address and the opcode is 3
      const instruction = {
        programAddress: address('ComputeBudget111111111111111111111111111111'),
        data: Uint8Array.from([3, 44, 1, 0, 0]),
      };

      expect(isComputeUnitPriceInstruction(instruction)).toBe(true);
    });

    it('returns false if the instruction is not program address is not the compute budget program address', () => {
      const instruction = {
        programAddress: address('59ArZcTrPbcFbEt7yU1JRrP8bWT6ZGcCMLiDVLLzYZ3m'),
        data: Uint8Array.from([3, 44, 1, 0, 0]),
      };

      expect(isComputeUnitPriceInstruction(instruction)).toBe(false);
    });

    it('returns false if the instruction is not a data opcode is not 3', () => {
      const instruction = {
        programAddress: address('ComputeBudget111111111111111111111111111111'),
        data: Uint8Array.from([2, 44, 1, 0, 0]),
      };

      expect(isComputeUnitPriceInstruction(instruction)).toBe(false);
    });
  });

  describe('isTransactionMessageWithComputeUnitPriceInstruction', () => {
    it('returns true if the transaction message has a compute unit price instruction', () => {
      const transactionMessage = {
        version: 0 as const,
        instructions: [
          {
            programAddress: address(
              'ComputeBudget111111111111111111111111111111',
            ),
            data: Uint8Array.from([3, 44, 1, 0, 0]),
          },
        ],
      };

      expect(
        isTransactionMessageWithComputeUnitPriceInstruction(transactionMessage),
      ).toBe(true);
    });

    it('returns false if the transaction message does not have a compute unit price instruction', () => {
      const transactionMessage = {
        version: 0 as const,
        instructions: [],
      };

      expect(
        isTransactionMessageWithComputeUnitPriceInstruction(transactionMessage),
      ).toBe(false);
    });
  });

  describe('setComputeUnitPriceInstructionIfMissing', () => {
    it('sets the compute unit price instruction if it is missing', () => {
      const transaction = {
        version: 0 as const,
        instructions: [],
      };
      const input = {
        microLamports: 1000000n,
      };

      const result = setComputeUnitPriceInstructionIfMissing(
        transaction,
        input,
      );

      expect(result).toStrictEqual({
        version: 0 as const,
        instructions: [
          {
            programAddress: address(
              'ComputeBudget111111111111111111111111111111',
            ),
            data: Uint8Array.from([3, 64, 66, 15, 0, 0, 0, 0, 0]),
          },
        ],
      });
    });

    it('does not set the compute unit price instruction if it is already present', () => {
      const transaction = {
        version: 0 as const,
        instructions: [
          {
            programAddress: address(
              'ComputeBudget111111111111111111111111111111',
            ),
            data: Uint8Array.from([3, 64, 66, 15, 0, 0, 0, 0, 0]), // 1000000n microLamports
          },
        ],
      };
      const input = {
        microLamports: 55555n, // Some other value
      };

      const result = setComputeUnitPriceInstructionIfMissing(
        transaction,
        input,
      );

      expect(result).toStrictEqual(transaction);
    });
  });

  describe('isComputeUnitLimitInstruction', () => {
    it('returns true if the instruction is a compute unit limit instruction', () => {
      // Is a compute unit limit instruction because program address is the compute budget program address and the opcode is 2
      const instruction = {
        programAddress: address('ComputeBudget111111111111111111111111111111'),
        data: Uint8Array.from([2, 44, 1, 0, 0]),
      };

      expect(isComputeUnitLimitInstruction(instruction)).toBe(true);
    });

    it('returns false if the instruction is not program address is not the compute budget program address', () => {
      const instruction = {
        programAddress: address('59ArZcTrPbcFbEt7yU1JRrP8bWT6ZGcCMLiDVLLzYZ3m'),
        data: Uint8Array.from([2, 44, 1, 0, 0]),
      };

      expect(isComputeUnitLimitInstruction(instruction)).toBe(false);
    });

    it('returns false if the instruction is not a data opcode is not 2', () => {
      const instruction = {
        programAddress: address('ComputeBudget111111111111111111111111111111'),
        data: Uint8Array.from([3, 44, 1, 0, 0]),
      };

      expect(isComputeUnitLimitInstruction(instruction)).toBe(false);
    });
  });

  describe('isTransactionMessageWithComputeUnitLimitInstruction', () => {
    it('returns true if the transaction message has a compute unit limit instruction', () => {
      const transactionMessage = {
        version: 0 as const,
        instructions: [
          {
            programAddress: address(
              'ComputeBudget111111111111111111111111111111',
            ),
            data: Uint8Array.from([2, 44, 1, 0, 0]),
          },
        ],
      };

      expect(
        isTransactionMessageWithComputeUnitLimitInstruction(transactionMessage),
      ).toBe(true);
    });

    it('returns false if the transaction message does not have a compute unit limit instruction', () => {
      const transactionMessage = {
        version: 0 as const,
        instructions: [],
      };

      expect(
        isTransactionMessageWithComputeUnitLimitInstruction(transactionMessage),
      ).toBe(false);
    });
  });

  describe('setComputeUnitLimitInstructionIfMissing', () => {
    it('sets the compute unit limit instruction if it is missing', () => {
      const transaction = {
        version: 0 as const,
        instructions: [],
      };
      const input = {
        units: 1000000,
      };

      const result = setComputeUnitLimitInstructionIfMissing(
        transaction,
        input,
      );

      expect(result).toStrictEqual({
        version: 0 as const,
        instructions: [
          {
            programAddress: address(
              'ComputeBudget111111111111111111111111111111',
            ),
            data: Uint8Array.from([2, 64, 66, 15, 0]),
          },
        ],
      });
    });

    it('does not set the compute unit limit instruction if it is already present', () => {
      const transaction = {
        version: 0 as const,
        instructions: [
          {
            programAddress: address(
              'ComputeBudget111111111111111111111111111111',
            ),
            data: Uint8Array.from([2, 64, 66, 15, 0]), // 1000000 units
          },
        ],
      };
      const input = {
        units: 55555, // Some other value
      };

      const result = setComputeUnitLimitInstructionIfMissing(
        transaction,
        input,
      );

      expect(result).toStrictEqual(transaction);
    });
  });

  describe('estimateAndOverrideComputeUnitLimit', () => {
    const transactionMessageWithNoComputeUnitLimit = {
      version: 0 as const,
      feePayer: {
        address: address('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      },
      lifetimeConstraint: {
        blockhash: blockhash('59ArZcTrPbcFbEt7yU1JRrP8bWT6ZGcCMLiDVLLzYZ3m'),
        lastValidBlockHeight: 18446744073709551615n,
      },
      instructions: [],
    };

    it('estimates the compute unit limit and sets it on a transaction message with no previous compute unit limit instruction', async () => {
      const result = await estimateAndOverrideComputeUnitLimit(
        transactionMessageWithNoComputeUnitLimit,
        rpc,
      );

      expect(result.instructions).toHaveLength(1);
      expect(result.instructions[0]).toStrictEqual({
        programAddress: address('ComputeBudget111111111111111111111111111111'),
        data: Uint8Array.from([2, 244, 1, 0, 0]),
      });
    });

    it('overrides the existing compute unit limit instruction if it is present', async () => {
      const transactionMessageWithComputeUnitLimit = {
        ...transactionMessageWithNoComputeUnitLimit,
        instructions: [
          {
            programAddress: address(
              'ComputeBudget111111111111111111111111111111',
            ),
            data: Uint8Array.from([2, 123, 4, 0, 0]),
          },
        ],
      };

      const result = await estimateAndOverrideComputeUnitLimit(
        transactionMessageWithComputeUnitLimit,
        rpc,
      );

      expect(result.instructions).toHaveLength(1);
      expect(result.instructions[0]).toStrictEqual({
        programAddress: address('ComputeBudget111111111111111111111111111111'),
        data: Uint8Array.from([2, 244, 1, 0, 0]),
      });
    });

    it('returns the units consumed from the error if the transaction simulation failed', async () => {
      jest
        .mocked(getComputeUnitEstimateForTransactionMessageFactory)
        .mockReturnValue(
          jest.fn().mockRejectedValue(
            // This code is the specific error code for failed transaction simulation when estimating the compute unit limit.
            // It ensures that the error includes the units consumed.
            new SolanaError(5663019, {
              unitsConsumed: 150,
            }),
          ),
        );

      const result = await estimateAndOverrideComputeUnitLimit(
        transactionMessageWithNoComputeUnitLimit,
        rpc,
      );

      expect(result.instructions[0]).toStrictEqual({
        programAddress: address('ComputeBudget111111111111111111111111111111'),
        data: Uint8Array.from([2, 150, 0, 0, 0]), // 150 units
      });
    });

    it('returns the original transaction message if the compute unit limit cannot be estimated', async () => {
      jest
        .mocked(getComputeUnitEstimateForTransactionMessageFactory)
        .mockReturnValue(
          jest.fn().mockRejectedValue(
            // Some other error code not related to compute unit limit estimation. The error doesn't contain the units consumed.
            new SolanaError(8190003),
          ),
        );

      const result = await estimateAndOverrideComputeUnitLimit(
        transactionMessageWithNoComputeUnitLimit,
        rpc,
      );

      expect(result.instructions).toHaveLength(0);
    });
  });
});
