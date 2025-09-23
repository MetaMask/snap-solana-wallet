import type { IInstruction } from '@solana/kit';
import { getBase58Codec } from '@solana/kit';

import {
  identifySecp256Instruction,
  isSecp256k1Instruction,
  isSecp256r1Instruction,
  parseVerifySecp256Instruction,
  Secp256Instruction,
  SECP256K1_PROGRAM_ADDRESS,
  SECP256R1_PROGRAM_ADDRESS,
} from './secp256k1-secp256r1';

describe('secp256k1-secp256r1', () => {
  describe('identifySecp256Instruction', () => {
    it('identifies the instruction', () => {
      const instruction = {
        programAddress: SECP256K1_PROGRAM_ADDRESS,
        data: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0]),
      };

      const identifiedInstruction = identifySecp256Instruction(instruction);

      expect(identifiedInstruction).toStrictEqual(Secp256Instruction.Verify);
    });
  });

  describe('isSecp256k1Instruction', () => {
    it('returns true for secp256k1 instruction', () => {
      const instruction = {
        programAddress: SECP256K1_PROGRAM_ADDRESS,
        data: new Uint8Array([0]),
      };

      const result = isSecp256k1Instruction(instruction);

      expect(result).toBe(true);
    });

    it('returns false for secp256r1 instruction', () => {
      const instruction = {
        programAddress: SECP256R1_PROGRAM_ADDRESS,
        data: new Uint8Array([0]),
      };

      const result = isSecp256k1Instruction(instruction);

      expect(result).toBe(false);
    });

    it('returns false for other instruction', () => {
      const instruction = {
        programAddress: 'SomeOtherProgramAddress',
        data: new Uint8Array([0]),
      } as unknown as IInstruction;

      const result = isSecp256k1Instruction(instruction);

      expect(result).toBe(false);
    });
  });

  describe('isSecp256r1Instruction', () => {
    it('returns true for secp256r1 instruction', () => {
      const instruction = {
        programAddress: SECP256R1_PROGRAM_ADDRESS,
        data: new Uint8Array([0]),
      };

      const result = isSecp256r1Instruction(instruction);

      expect(result).toBe(true);
    });

    it('returns false for secp256k1 instruction', () => {
      const instruction = {
        programAddress: SECP256K1_PROGRAM_ADDRESS,
        data: new Uint8Array([0]),
      };

      const result = isSecp256r1Instruction(instruction);

      expect(result).toBe(false);
    });

    it('returns false for other instruction', () => {
      const instruction = {
        programAddress: 'SomeOtherProgramAddress',
        data: new Uint8Array([0]),
      } as unknown as IInstruction;

      const result = isSecp256r1Instruction(instruction);

      expect(result).toBe(false);
    });
  });

  describe('parseVerifySecp256Instruction', () => {
    it('parses an empty secp256k1 instruction', () => {
      const instruction = {
        programAddress: SECP256K1_PROGRAM_ADDRESS,
        data: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0]),
      };

      const parsedInstruction = parseVerifySecp256Instruction(instruction);

      expect(parsedInstruction).toStrictEqual({
        programAddress: SECP256K1_PROGRAM_ADDRESS,
        data: { numSignatures: 0 },
      });
    });

    it('parses an empty secp256r1 instruction', () => {
      const instruction = {
        programAddress: SECP256R1_PROGRAM_ADDRESS,
        data: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0]),
      };

      const parsedInstruction = parseVerifySecp256Instruction(instruction);

      expect(parsedInstruction).toStrictEqual({
        programAddress: SECP256R1_PROGRAM_ADDRESS,
        data: { numSignatures: 0 },
      });
    });

    it('parses a real-world secp256k1 instruction', () => {
      /**
       * Taken from this transaction: https://solscan.io/tx/h6CgrypQ1WQcpSCxdF1ot8ghhHwdvZ2aEDq4T5D7uYgbrTsyzh2FcmUmduXpW1EJ1VMYnMxFwVNC8DE85rz8i7e
       * It contains 3 secp256k1 signatures.
       */
      const instructionBase58 =
        '4GitRX1TrUudSfhNjqnrEr8moSWnpf8JFgUcETEVr9zj8N1tJEPFtwkyAX2mNSF2QUAmPB8tajRgfUWBnrjL3E9yLLX9S3iN91LpR2YtR95G8Gxhydrx7fJAdUmxnz2DDvmSNSJUFFJGi7KwwFPohJK5PjAVBgiP1GjUEiFjWP7KDjWeak7qkKT7P2wGssiMd28Zdn5awtA931LWjkQ2iNf8wK6AQfpGhQqnBgmeq1PZm5SmqdvANfdrJzN1iMPLUoUgrNde8WgVSDx9RQmhbnwLeK6zbSxGUx48AUBCfXV7EncCGz5HfbyGqKjNzE52Jecv2E2U6vacEcqauESgULLWn88wvWa9Zq4nL4KFXNivrDZT6PunaM7LSe6nkdtvdLExitw1vomz7XRxXZWzSy4HKhGKL4ZzEDgRuQy2y1iGvvXwq5j1Wa';

      const bytes = getBase58Codec().encode(instructionBase58);

      const parsedInstruction = parseVerifySecp256Instruction({
        programAddress: SECP256K1_PROGRAM_ADDRESS,
        data: bytes,
      });

      expect(parsedInstruction).toStrictEqual({
        programAddress: SECP256K1_PROGRAM_ADDRESS,
        data: { numSignatures: 3 },
      });
    });

    it('parses a real-world secp256r1 instruction', () => {
      /**
       * Taken from this transaction: https://solscan.io/tx/2CDp2XYu3KsfhKnCmbPKoqxfF34ootxr2L8TFf5cqCZVXbotSyQB2SRbiEu3gsBceZwq9D6hFXCBhhEAUerqELXp
       * It contains 3 secp256r1 signatures.
       */
      const instructionBase58 =
        '37bVnf5k5XNTVwdBpMaj56HaSdM5wjEsUcWkSNab2fVyUdekdyaxYJcFq2GatwnuQyTUMMB3GWTF7gmVv9CiKbw3HGUX1868ghSuq7FdpKb2v7UHPBhEfpANQ4dithun9HJCsfmnZpcD16xTt8FL8ZvVugd76arLFRqEiUfXEqVt1M96QSiw5gAei2L8e43bLW1USz98ABchXNPFS4fqUxuoHq37Kp7RHnQgsB6CFbYVYKPqFaksnV5j';

      const bytes = getBase58Codec().encode(instructionBase58);

      const parsedInstruction = parseVerifySecp256Instruction({
        programAddress: SECP256K1_PROGRAM_ADDRESS,
        data: bytes,
      });

      expect(parsedInstruction).toStrictEqual({
        programAddress: SECP256K1_PROGRAM_ADDRESS,
        data: { numSignatures: 1 },
      });
    });

    it('parses instruction with different number of signatures', () => {
      const instruction = {
        programAddress: SECP256K1_PROGRAM_ADDRESS,
        data: new Uint8Array([5, 0, 0, 0, 0, 0, 0, 0, 0]),
      };

      const parsedInstruction = parseVerifySecp256Instruction(instruction);

      expect(parsedInstruction).toStrictEqual({
        programAddress: SECP256K1_PROGRAM_ADDRESS,
        data: { numSignatures: 5 },
      });
    });
  });
});
