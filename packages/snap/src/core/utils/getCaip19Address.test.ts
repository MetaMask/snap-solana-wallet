import type { CaipAssetType } from '@metamask/keyring-api';

import { getCaip19Address } from './getCaip19Address';

describe('getCaip19Address', () => {
  it('extracts token address from CAIP-19 token ID', () => {
    const caip19Id =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as CaipAssetType;
    expect(getCaip19Address(caip19Id)).toBe(
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    );
  });

  it('extracts currency code from ISO-4217 ID', () => {
    const currencyId =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/iso4217:USD' as CaipAssetType;
    expect(getCaip19Address(currencyId)).toBe('USD');
  });

  it('returns last part when no token or currency prefix', () => {
    const simpleId =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501' as CaipAssetType;
    expect(getCaip19Address(simpleId)).toBe('slip44:501');
  });

  it('handles empty input', () => {
    expect(getCaip19Address('' as CaipAssetType)).toBe('');
  });

  it('handles malformed CAIP-19 ID', () => {
    const malformedId = 'solana5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
    expect(getCaip19Address(malformedId as CaipAssetType)).toBe(malformedId);
  });
});
