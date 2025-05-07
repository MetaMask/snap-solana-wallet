import BigNumber from 'bignumber.js';

/**
 * Decodes the amount from the instruction data.
 * @param data - The instruction data.
 * @returns The amount.
 */
export function decodeSplTransferAmount(data: Uint8Array): BigNumber {
  /**
   * Native Solana transfers have a fixed length of 12 bytes.
   * 1 byte - Opcode
   * 8 bytes - Transfer amount unsigned int 64
   */
  let raw = BigInt(0);

  for (let i = 1; i < 9; i++) {
    // eslint-disable-next-line no-bitwise
    raw |= BigInt(data[i] ?? 0) << BigInt(8 * (i - 1));
  }

  return BigNumber(raw.toString()).dividedBy(1e6);
}
