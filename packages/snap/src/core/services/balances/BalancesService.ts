import type { CaipAssetType, Transaction } from '@metamask/keyring-api';
import { type Balance } from '@metamask/keyring-api';
import type { GetTransactionApi } from '@solana/web3.js';

import type { SolanaTokenMetadata } from '../../clients/token-metadata-client/types';
import type { Network } from '../../constants/solana';
import {
  Networks,
  SOL_SYMBOL,
  SolanaCaip19Tokens,
} from '../../constants/solana';
import { refreshAssets } from '../../handlers/onCronjob/refreshAssets';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import { lamportsToSol } from '../../utils/conversion';
import { fromTokenUnits } from '../../utils/fromTokenUnit';
import { getAccountIdFromAddress } from '../../utils/getAccountIdFromAddress';
import { getNetworkFromToken } from '../../utils/getNetworkFromToken';
import type { AssetsService } from '../assets/AssetsService';
import type { EncryptedState } from '../encrypted-state/EncryptedState';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';

export class BalancesService {
  readonly #assetsService: AssetsService;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #state: EncryptedState;

  constructor(
    assetsService: AssetsService,
    tokenMetadataService: TokenMetadataService,
    state: EncryptedState,
  ) {
    this.#assetsService = assetsService;
    this.#tokenMetadataService = tokenMetadataService;
    this.#state = state;
  }

  /**
   * Returns the balances and metadata of the given account for the given assets.
   * @param account - The account to get the balances for.
   * @param assets - The assets to get the balances for (CAIP-19 ids).
   * @returns The balances and metadata of the account for the given assets.
   */
  async getAccountBalances(
    account: SolanaKeyringAccount,
    assets: CaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    const balances = new Map<CaipAssetType, Balance>();
    const metadata = new Map<CaipAssetType, SolanaTokenMetadata>();

    const assetsByNetwork = assets.reduce<Record<Network, CaipAssetType[]>>(
      (groups, asset) => {
        const network = getNetworkFromToken(asset);

        if (!groups[network]) {
          groups[network] = [];
        }

        groups[network].push(asset);
        return groups;
      },
      // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
      {} as Record<Network, CaipAssetType[]>,
    );

    for (const network of Object.keys(assetsByNetwork)) {
      const currentNetwork = network as Network;
      const networkAssets = assetsByNetwork[currentNetwork];

      const [nativeAsset, tokenAssets] = await Promise.all([
        this.#assetsService.getNativeAsset(account.address, currentNetwork),
        this.#assetsService.discoverTokens(account.address, currentNetwork),
      ]);

      const tokenMetadata = await this.#tokenMetadataService.getTokensMetadata([
        nativeAsset.address,
        ...tokenAssets.map((token) => token.address),
      ]);

      for (const asset of networkAssets) {
        // update token metadata if exist
        if (tokenMetadata[asset]) {
          metadata.set(asset, tokenMetadata[asset]);
        }

        if (asset.endsWith(SolanaCaip19Tokens.SOL)) {
          // update native asset balance
          balances.set(asset, {
            amount: lamportsToSol(nativeAsset.balance).toString(),
            unit: SOL_SYMBOL,
          });
        } else {
          const splToken = tokenAssets.find((token) => token.address === asset);

          // update spl token balance if exist
          if (splToken) {
            balances.set(asset, {
              amount: fromTokenUnits(splToken.balance, splToken.decimals),
              unit: tokenMetadata[splToken.address]?.symbol ?? 'UNKNOWN',
            });
          }
        }
      }
    }

    const result = Object.fromEntries(balances.entries());

    await this.#state.update((state) => {
      return {
        ...state,
        assets: {
          ...(state?.assets ?? {}),
          [account.id]: result,
        },
        metadata: {
          ...(state?.metadata ?? {}),
          ...Object.fromEntries(metadata.entries()),
        },
      };
    });

    return result;
  }

  /**
   * Updates native token balances for accounts based on transaction data.
   * @param scope - The network scope.
   * @param transactionData - The transaction data containing balance information.
   * @param currentAccounts - The current accounts in the keyring.
   * @param currentBalances - The current balances to update (modified in-place).
   * @returns The updated balances (same reference as currentBalances).
   */
  #updateNativeTokenBalances(
    scope: Network,
    transactionData: ReturnType<GetTransactionApi['getTransaction']>,
    currentAccounts: SolanaKeyringAccount[],
    currentBalances: Record<string, Record<CaipAssetType, Balance>>,
  ): Record<string, Record<CaipAssetType, Balance>> {
    if (!transactionData?.meta) {
      return currentBalances;
    }

    const allAccountAddresses = [
      ...transactionData.transaction.message.accountKeys,
      ...(transactionData.meta?.loadedAddresses?.writable ?? []),
      ...(transactionData.meta?.loadedAddresses?.readonly ?? []),
    ];

    const { postBalances, preBalances } = transactionData.meta;

    for (let i = 0; i < postBalances.length; i++) {
      const address = allAccountAddresses[i];
      const preBalance = BigInt(preBalances[i] ?? 0);
      const postBalance = BigInt(postBalances[i] ?? 0);

      if (preBalance === postBalance) {
        continue;
      }

      const accountId = getAccountIdFromAddress(
        currentAccounts,
        address as string,
      );

      if (!accountId) {
        continue;
      }

      const newBalance = lamportsToSol(Number(postBalance)).toString();

      if (!currentBalances[accountId]) {
        currentBalances[accountId] = {};
      }

      currentBalances[accountId] = {
        ...currentBalances[accountId],
        [Networks[scope].nativeToken.caip19Id]: {
          amount: newBalance,
          unit: Networks[scope].nativeToken.symbol,
        },
      };
    }

    return currentBalances;
  }

  async updateBalancesPostTransaction(transaction: Transaction): Promise<void> {
    /**
     * For all transactions, find which accounts are involved and add them to a list
     * They can be either the sender or the receiver of a transaction.
     * Then, for each account, trigger the `refreshAssets` method.
     */

    const currentState = await this.#state.get();
    const keyringAccounts = Object.values(currentState.keyringAccounts);

    const addresses = [
      ...transaction.from.map((from) => from.address),
      ...transaction.to.map((to) => to.address),
    ];

    const accountsChanged = keyringAccounts.filter((account) =>
      addresses.includes(account.address),
    );

    for (const account of accountsChanged) {
      await refreshAssets({
        request: {
          params: {
            accountId: account.id,
          },
        },
      });
    }
  }
}
