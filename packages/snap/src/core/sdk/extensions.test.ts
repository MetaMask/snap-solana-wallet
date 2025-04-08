import { address, blockhash } from '@solana/kit';

import {
  isComputeUnitLimitInstruction,
  isComputeUnitPriceInstruction,
  isTransactionMessageWithComputeUnitLimitInstruction,
  isTransactionMessageWithComputeUnitPriceInstruction,
  isTransactionMessageWithFeePayer,
  setComputeUnitLimitInstructionIfMissing,
  setComputeUnitPriceInstructionIfMissing,
  setTransactionMessageFeePayerIfMissing,
  setTransactionMessageLifetimeUsingBlockhashIfMissing,
} from './extensions';

describe('extensions', () => {
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
});
