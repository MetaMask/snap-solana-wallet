import { KnownCaip19Id } from '../../constants/solana';
import { isSnapOwnedAsset } from './snapOwnedAssets';

describe('isSnapOwnedAsset', () => {
  it('returns true for NFT CAIP-19 asset IDs', () => {
    expect(
      isSnapOwnedAsset(
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/nft:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      ),
    ).toBe(true);
  });

  it('returns false for fungible native and token asset IDs', () => {
    expect(isSnapOwnedAsset(KnownCaip19Id.SolMainnet)).toBe(false);
    expect(isSnapOwnedAsset(KnownCaip19Id.UsdcMainnet)).toBe(false);
  });
});
