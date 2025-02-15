import type { CaipAssetType } from '@metamask/keyring-api';

/**
 * Checks if a CAIP-19 asset ID represents a fiat currency.
 *
 * @param caipAssetId - The CAIP-19 asset ID to check.
 * @returns `true` if the CAIP-19 asset ID represents a fiat currency, `false` otherwise.
 */
export function isFiat(caipAssetId: CaipAssetType): boolean {
  return caipAssetId.includes('swift:0/iso4217:');
}
