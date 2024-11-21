import { validateSolAddress } from './validate-sol-address';

describe('validateSolAddress', () => {
  it('should return true for valid Solana addresses', async () => {
    const validAddresses = [
      'ErJwUq5Uzo88NDNHRxyGgz9St1N9kPfMD2yVGCPksnyK',
      'SoLFoodE4xjDWwa7vKB5qWEnBqhQFm1RPbJnwbS3Qyr',
    ];

    for (const address of validAddresses) {
      expect(await validateSolAddress(address)).toBe(true);
    }
  });

  it('should return false for invalid Solana addresses', async () => {
    const invalidAddresses = [
      '',
      'too-short',
      '0x1234567890123456789012345678901234567890',
      // invalid characters
      'ErJwUq5Uzo88NDNHRxyGgz9St1N9kPfMD2yVGCPksnyK!',
      // too long
      'ErJwUq5Uzo88NDNHRxyGgz9St1N9kPfMD2yVGCPksnyKAAAA',
    ];

    for (const address of invalidAddresses) {
      expect(await validateSolAddress(address)).toBe(false);
    }
  });

  // Future .sol domain implementation
  it.skip('should handle .sol domains (TBA)', async () => {
    const solDomain = 'banana.sol';
    expect(await validateSolAddress(solDomain)).toBe(true);
  });
});
