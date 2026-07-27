import type { Codec, IInstruction, ReadonlyUint8Array } from '@solana/kit';
import { address, getStructCodec, getU8Codec } from '@solana/kit';

/**
 * Utilities for parsing secp256k1 and secp256r1 program instructions.
 *
 * Unfortunately, Solana doesn't provide a JS/TS client for secp256k1 and secp256r1 programs, unlike other programs,
 * for instance:
 *
 * @see https://github.com/solana-program/token-2022/blob/main/clients/js/src/generated/instructions/createAssociatedToken.ts
 * @see https://github.com/solana-program/compute-budget/blob/main/clients/js/src/generated/instructions/setComputeUnitLimit.ts
 *
 * So we have to create our own utilities.
 * NOTE: This implementation intentionally simplifies parsing by extracting only the first byte
 * of the instruction data, which represents the `numSignatures` field. This is currently the only
 * field required for our use case. The remainder of the instruction data is not parsed, as it is
 * complex and unnecessary for our current needs.
 *
 * This simplification enables us to share identifiers, codecs, types, and parsers between both programs.
 * If full parsing is ever required, separate implementations for each program should be created.
 * @see https://docs.rs/solana-secp256k1-program/latest/solana_secp256k1_program/
 * @see https://docs.rs/solana-secp256r1-program/latest/solana_secp256r1_program/
 * @see https://github.com/search?q=repo%3Aanza-xyz%2Fagave%20secp256k1&type=code
 * @see https://github.com/search?q=repo%3Aanza-xyz%2Fagave%20secp256r1&type=code
 */

export const SECP256K1_PROGRAM_ADDRESS = address(
  'KeccakSecp256k11111111111111111111111111111',
);

export const SECP256R1_PROGRAM_ADDRESS = address(
  'Secp256r1SigVerify1111111111111111111111111',
);

export enum Secp256Instruction {
  Verify = 0,
}

export const identifySecp256Instruction = (
  _instruction:
    | {
        data: ReadonlyUint8Array;
      }
    | ReadonlyUint8Array,
) => Secp256Instruction.Verify;

export const isSecp256k1Instruction = (instruction: IInstruction) =>
  instruction.programAddress === SECP256K1_PROGRAM_ADDRESS;

export const isSecp256r1Instruction = (instruction: IInstruction) =>
  instruction.programAddress === SECP256R1_PROGRAM_ADDRESS;

type Secp256InstructionData = {
  numSignatures: number;
  /** There is actually more data after numSignatures */
};

const getSecp256InstructionCodec = (): Codec<Secp256InstructionData> =>
  getStructCodec([
    ['numSignatures', getU8Codec()], // This is the first byte of the data
    /** There is actually more data after this byte */
  ]);

type ParsedVerifySecp256Instruction = {
  readonly programAddress: string;
  data: Secp256InstructionData;
};

export type ParsedSecp256Instruction = {
  instructionType: Secp256Instruction.Verify;
} & ParsedVerifySecp256Instruction;

export const parseVerifySecp256Instruction = (instruction: IInstruction) => {
  return {
    programAddress: instruction.programAddress,
    data: getSecp256InstructionCodec().decode(
      instruction.data ?? new Uint8Array(),
    ),
  };
};
