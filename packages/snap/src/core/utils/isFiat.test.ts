import type { CaipAssetType } from '@metamask/keyring-api';

import { isFiat } from './isFiat';

describe('isFiat', () => {
  it('should return true for valid fiat CAIP-19 asset IDs', () => {
    expect(isFiat('swift:0/iso4217:USD')).toBe(true);
    expect(isFiat('swift:0/iso4217:EUR')).toBe(true);
    expect(isFiat('swift:0/iso4217:GBP')).toBe(true);
  });

  it('should return false for non-fiat CAIP-19 asset IDs', () => {
    expect(isFiat('eip155:1/erc20:0x123')).toBe(false);
    expect(isFiat('bip122:000000000019d6689c085ae165831e93/slip44:1')).toBe(
      false,
    );
    expect(isFiat('cosmos:cosmoshub-4/slip44:118')).toBe(false);
  });

  it('should return false for invalid or malformed asset IDs', () => {
    expect(isFiat('' as CaipAssetType)).toBe(false);
    expect(isFiat('swift:0' as CaipAssetType)).toBe(false);
    expect(isFiat('iso4217:USD' as CaipAssetType)).toBe(false);
  });
});
