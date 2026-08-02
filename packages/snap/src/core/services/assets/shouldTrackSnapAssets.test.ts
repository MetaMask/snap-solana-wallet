import { SnapsAssetsMigrationStage } from '@metamask/assets-controller';

import { shouldTrackSnapAssets } from './shouldTrackSnapAssets';

describe('shouldTrackSnapAssets', () => {
  it.each([
    [SnapsAssetsMigrationStage.Off, true],
    [SnapsAssetsMigrationStage.ReadAssetsControllerWithFallback, true],
    [SnapsAssetsMigrationStage.ReadAssetsControllerWithoutFallback, true],
    [SnapsAssetsMigrationStage.ReadAssetsControllerOnly, false],
  ])('returns %s for stage %s', (stage, expected) => {
    expect(shouldTrackSnapAssets(stage)).toBe(expected);
  });
});
