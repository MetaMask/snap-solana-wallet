import { address } from '@solana/kit';
import type { CompiledTransactionMessage } from '@solana/kit';

import { normalizeCompiledTransactionMessage } from './normalizeCompiledTransactionMessage';

describe('normalizeCompiledTransactionMessage', () => {
  it('normalizes a compiled transaction message correctly', () => {
    const mockCompiledTransactionMessage: CompiledTransactionMessage = {
      staticAccounts: [
        address('3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br'),
        address('ComputeBudget111111111111111111111111111111'),
        address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
        address('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
      ],
      instructions: [
        {
          programAddressIndex: 0,
          data: new Uint8Array([0, 139, 203, 23, 160, 77, 48, 130, 0]),
        },
        {
          programAddressIndex: 1,
          data: new Uint8Array([2, 184, 129, 22, 0]),
        },
        {
          programAddressIndex: 1,
          data: new Uint8Array([3, 32, 161, 7, 0, 0, 0, 0]),
        },
        {
          programAddressIndex: 2,
          data: new Uint8Array([1]),
        },
        {
          programAddressIndex: 3,
          data: new Uint8Array([
            193, 32, 155, 51, 65, 214, 156, 129, 3, 3, 0, 0, 0, 38, 100, 0, 1,
            38, 100, 1, 2, 26, 100, 2, 3, 64, 66, 15, 0, 0, 0, 0, 0, 187, 242,
            72, 81, 1, 0, 0, 0, 50, 0, 0,
          ]),
        },
      ],
    } as unknown as CompiledTransactionMessage;

    const result = normalizeCompiledTransactionMessage(
      mockCompiledTransactionMessage,
    );

    expect(result).toStrictEqual({
      ed25519Signatures: ['signature'],
      instructions: [
        {
          accounts: [],
          data: new Uint8Array([0, 139, 203, 23, 160, 77, 48, 130, 0]),
          programAddress: '3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br',
        },
        {
          accounts: [],
          data: new Uint8Array([2, 184, 129, 22, 0]),
          programAddress: 'ComputeBudget111111111111111111111111111111',
        },
        {
          accounts: [],
          data: new Uint8Array([3, 32, 161, 7, 0, 0, 0, 0]),
          programAddress: 'ComputeBudget111111111111111111111111111111',
        },
        {
          accounts: [],
          data: new Uint8Array([1]),
          programAddress: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
        },
        {
          accounts: [],
          data: new Uint8Array([
            193, 32, 155, 51, 65, 214, 156, 129, 3, 3, 0, 0, 0, 38, 100, 0, 1,
            38, 100, 1, 2, 26, 100, 2, 3, 64, 66, 15, 0, 0, 0, 0, 0, 187, 242,
            72, 81, 1, 0, 0, 0, 50, 0, 0,
          ]),
          programAddress: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
        },
      ],
    });
  });
});
