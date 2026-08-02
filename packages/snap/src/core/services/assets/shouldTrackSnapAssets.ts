import { SnapsAssetsMigrationStage } from '@metamask/assets-controller';

/**
 * Returns whether the Snap should persist fungible asset balances for the given
 * migration stage. NFT assets are always tracked by the Snap regardless of stage.
 *
 * @param stage - Assets migration stage for the chain.
 * @returns Whether Snap-side fungible asset tracking is enabled.
 */
export function shouldTrackSnapAssets(
  stage: SnapsAssetsMigrationStage,
): boolean {
  return stage < SnapsAssetsMigrationStage.ReadAssetsControllerOnly;
}
