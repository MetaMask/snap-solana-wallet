import { EXPECTED_SEND_SPL_TOKEN_AND_CREATE_TOKEN_ACCOUNT_DATA } from '../../test/mocks/transactions-data/send-spl-token-and-create-token-account';
import { EXPECTED_SWAP_SOL_TO_USDC_DATA } from '../../test/mocks/transactions-data/swap-sol-to-usdc';
import { normalizeSolanaTransaction } from './normalizeSolanaTransaction';

describe('normalizeSolanaTransaction', () => {
  it('normalizes an SPL token transfer with account creation', () => {
    const result = normalizeSolanaTransaction(
      EXPECTED_SEND_SPL_TOKEN_AND_CREATE_TOKEN_ACCOUNT_DATA,
    );

    expect(result.ed25519Signatures).toHaveLength(1);
    expect(result.instructions.length).toBeGreaterThan(1);

    const programAddresses = result.instructions.map((i) => i.programAddress);
    expect(programAddresses).toContain(
      'ComputeBudget111111111111111111111111111111',
    );
    expect(programAddresses).toContain(
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    );
    expect(programAddresses).toContain(
      'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    );

    result.instructions.forEach((instruction) => {
      expect(Array.isArray(instruction.accounts)).toBe(true);
      expect(instruction.data).toBeInstanceOf(Uint8Array);
      expect(typeof instruction.programAddress).toBe('string');
    });
  });

  it('normalizes a Jupiter swap transaction', () => {
    const result = normalizeSolanaTransaction(EXPECTED_SWAP_SOL_TO_USDC_DATA);

    expect(result.ed25519Signatures).toHaveLength(1);
    expect(result.instructions.length).toBeGreaterThan(3);

    const programAddresses = result.instructions.map((i) => i.programAddress);
    expect(programAddresses).toContain(
      'ComputeBudget111111111111111111111111111111',
    );
    expect(programAddresses).toContain(
      'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
    );

    result.instructions.forEach((instruction) => {
      expect(Array.isArray(instruction.accounts)).toBe(true);
      expect(instruction.data).toBeInstanceOf(Uint8Array);
      expect(typeof instruction.programAddress).toBe('string');
    });
  });
});
