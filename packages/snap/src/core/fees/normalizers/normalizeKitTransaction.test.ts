import { MOCK_EXECUTION_SCENARIO_LIFI_SWAP } from '../../services/signer/mocks/scenarios/lifiSwap';
import { normalizeKitTransaction } from './normalizeKitTransaction';

describe('normalizeKitTransaction', () => {
  it('normalizes a Lifi Swap transaction correctly', () => {
    const mockTransaction = MOCK_EXECUTION_SCENARIO_LIFI_SWAP.signedTransaction;

    const result = normalizeKitTransaction(mockTransaction);

    expect(result).toStrictEqual({
      ed25519Signatures: [
        new Uint8Array([
          11, 34, 157, 107, 188, 168, 51, 10, 75, 131, 104, 67, 181, 199, 19,
          239, 51, 223, 112, 156, 236, 164, 212, 5, 131, 172, 248, 115, 35, 244,
          132, 219, 249, 196, 254, 153, 3, 104, 152, 72, 2, 208, 23, 254, 129,
          247, 107, 253, 49, 78, 204, 25, 25, 158, 145, 243, 244, 146, 176, 229,
          187, 120, 7, 0,
        ]),
      ],
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
