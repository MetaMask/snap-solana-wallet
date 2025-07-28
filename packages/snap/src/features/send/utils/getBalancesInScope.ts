import type { Balance } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';

import { Networks, type Network } from '../../../core/constants/solana';
import type { AccountId } from '../../../core/services/state/State';
import type { AssetEntity } from '../../../entities';

/**
 * Given the balances of all accounts, which includes tokens from all scopes,
 * return the balances of the given scope and filters them out if they have a zero balance.
 * This is used to display the balances in the send flow because we only want to show the tokens
 * that the user can send OR an empty SOL balance.
 *
 * @param scope - The scope to get the balances for.
 * @param assetEntities - The asset entities of all accounts.
 * @returns The balances of the given scope.
 */
export function getBalancesInScope(
  scope: Network,
  assetEntities: AssetEntity[],
): Record<AccountId, Record<CaipAssetType, Balance>> {
  return assetEntities
    .filter((item) => {
      /**
       * The tokens we can send are:
       * - The native token, which can be 0 for display purposes.
       * - All tokens for the given scope with a non-zero balance.
       */
      const isNativeToken =
        item.assetType === Networks[scope].nativeToken.caip19Id;

      const isInScope = item.assetType.startsWith(scope);
      const hasNonZeroBalance = item.rawAmount !== '0';

      return isNativeToken || (isInScope && hasNonZeroBalance);
    })
    .reduce<Record<AccountId, Record<CaipAssetType, Balance>>>((acc, item) => {
      acc[item.keyringAccountId] = {
        ...acc[item.keyringAccountId],
        [item.assetType]: {
          unit: item.symbol,
          amount: item.uiAmount,
        },
      };
      return acc;
    }, {});
}
