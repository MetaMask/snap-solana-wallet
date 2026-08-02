/**
 * Returns whether an asset remains exclusively managed by the Snap.
 *
 * AssetsController does not persist Solana NFT balances. NFT assets must always
 * be read, synchronized, persisted, and published by the Snap, regardless of
 * the assets migration stage.
 *
 * @param assetId - CAIP-19 asset ID.
 * @returns Whether the asset is exclusively managed by the Snap.
 */
export function isSnapOwnedAsset(assetId: string): boolean {
  return assetId.includes('/nft:');
}
