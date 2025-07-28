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
  assetEntities: Record<AccountId, AssetEntity[]>,
): Record<AccountId, Record<CaipAssetType, Balance>> {
  //   const asList = Object.values(assetEntities).flat();

  return Object.values(assetEntities)
    .flat()
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
          //   amount: item.rawAmount,
          //   decimals: 'decimals' in item ? item.decimals : 0,
          //   symbol: item.symbol,
        },
      };
      return acc;
    }, {});
  //   return Object.fromEntries(
  //     Object.entries(assetEntities).map(([accountId, perAccountBalances]) => [
  //       accountId,
  //       Object.fromEntries(
  //         Object.entries(perAccountBalances).filter(
  //           ([assetCaipId, perAccountTokenBalance]) => {
  //             /**
  //              * The tokens we can send are:
  //              * - The native token, which can be 0 for display purposes.
  //              * - All tokens for the given scope with a non-zero balance.
  //              */
  //             const isNativeToken =
  //               assetCaipId === Networks[scope].nativeToken.caip19Id;

  //             const isInScope = assetCaipId.startsWith(scope);
  //             const hasNonZeroBalance = perAccountTokenBalance.amount !== '0';

  //             return isNativeToken || (isInScope && hasNonZeroBalance);
  //           },
  //         ),
  //       ),
  //     ]),
  //   );
  //   return Object.fromEntries(
  //     Object.entries(assetEntities).map(([accountId, perAccountBalances]) => [
  //       accountId,
  //       Object.fromEntries(
  //         perAccountBalances
  //           .filter((item) => item.network === scope)
  //           .map((item) => [item.assetType, item.uiAmount]),
  //       ),
  //     ]),
  //   );
}
