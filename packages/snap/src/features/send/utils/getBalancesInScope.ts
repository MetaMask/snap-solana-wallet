import type { Balance } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';

import { Networks, type Network } from '../../../core/constants/solana';
import type { AccountId } from '../../../core/services/encrypted-state/EncryptedState';

/**
 * Given the balances of all accounts, which includes tokens from all scopes,
 * return the balances of the given scope and filters them out if they have a zero balance.
 * This is used to display the balances in the send flow because we only want to show the tokens
 * that the user can send OR an empty SOL balance.
 *
 * @param params - The parameters for the function.
 * @param params.scope - The scope to get the balances for.
 * @param params.balances - The balances of all accounts.
 * @returns The balances of the given scope.
 */
export function getBalancesInScope({
  scope,
  balances,
}: {
  scope: Network;
  balances: Record<AccountId, Record<CaipAssetType, Balance>>;
}): Record<AccountId, Record<CaipAssetType, Balance>> {
  return Object.fromEntries(
    Object.entries(balances).map(([accountId, perAccountBalances]) => [
      accountId,
      Object.fromEntries(
        Object.entries(perAccountBalances).filter(
          ([assetCaipId, perAccountTokenBalance]) => {
            /**
             * The tokens we can send are:
             * - The native token, which can be 0 for display purposes.
             * - All tokens for the given scope with a non-zero balance.
             */
            const isNativeToken =
              assetCaipId === Networks[scope].nativeToken.caip19Id;

            const isInScope = assetCaipId.startsWith(scope);
            const hasNonZeroBalance = perAccountTokenBalance.amount !== '0';

            return isNativeToken || (isInScope && hasNonZeroBalance);
          },
        ),
      ),
    ]),
  );
}
