import type { CaipAssetType } from '@metamask/keyring-api';
import { type Balance } from '@metamask/keyring-api';

import type { SolanaTokenMetadata } from '../../clients/token-metadata-client/types';
import type { Network } from '../../constants/solana';
import { SOL_SYMBOL, SolanaCaip19Tokens } from '../../constants/solana';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import { lamportsToSol } from '../../utils/conversion';
import { fromTokenUnits } from '../../utils/fromTokenUnit';
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

  //   /**
  //    * Updates the balances of the accounts after a set of transactions have been executed.
  //    * @param transactions - The transactions to update the balances for.
  //    * @returns A Promise that resolves to the updated balances.
  //    */
  //   async updateBalancesPostTransactions(
  //     transactions: Transaction[],
  //   ): Promise<Record<string, Record<string, Balance>>> {
  //     const currentState = await this.#state.get();
  //     const currentAccounts = Object.values(currentState.keyringAccounts);
  //     const currentBalances = currentState.assets;

  //     const updatedAccountBalances: Record<string, Record<string, Balance>> = {};

  //     const sourceTransactions = transactions.filter(
  //       (transaction) => transaction.type === 'send',
  //     );
  //     const destinationTransactions = transactions.filter(
  //       (transaction) => transaction.type === 'receive',
  //     );

  //     /**
  //      * For each source transaction:
  //      * 1. Get the asset and source address
  //      * 2. Using the address, get the keyring account
  //      * 3. Update the balance of the asset by removing the amount from the source address
  //      */
  //     for (const sourceTransaction of sourceTransactions) {
  //       const { asset, address } = sourceTransaction;

  //       const keyringAccount = currentAccounts.find(
  //         (currentAccount) => currentAccount.address === address,
  //       );

  //       if (!keyringAccount) {
  //         continue;
  //       }

  //       if (!asset?.fungible) {
  //         continue;
  //       }

  //       const assetId = asset.type;
  //       const currentBalance =
  //         currentBalances[keyringAccount.id]?.[assetId]?.amount;

  //       if (!currentBalance) {
  //         continue;
  //       }

  //       const fee = transactions?.fees.map((fee) =>
  //         fee.asset.type === assetId ? fee.amount : 0,
  //       );
  //       const sentAmount = asset.amount - fee;
  //       const newBalance = BigNumber(currentBalance)
  //         .minus(sentAmount)
  //         .minus(fee)
  //         .toString();

  //       updatedAccountBalances[keyringAccount.id] = {
  //         ...updatedAccountBalances[keyringAccount.id],
  //         [assetId]: {
  //           amount: newBalance,
  //           unit: asset.unit,
  //         },
  //       };
  //     }

  //     for (const destinationTransaction of destinationTransactions) {
  //       const { asset, address } = destinationTransaction;

  //       const keyringAccount = currentAccounts.find(
  //         (currentAccount) => currentAccount.address === address,
  //       );

  //       if (!keyringAccount) {
  //         continue;
  //       }

  //       if (!asset?.fungible) {
  //         continue;
  //       }

  //       const assetId = asset.type;
  //       const currentBalance =
  //         currentBalances[keyringAccount.id]?.[assetId]?.amount;

  //       if (!currentBalance) {
  //         continue;
  //       }

  //       const receivedAmount = asset.amount;
  //       const newBalance = BigNumber(currentBalance)
  //         .plus(receivedAmount)
  //         .toString();

  //       updatedAccountBalances[keyringAccount.id] = {
  //         ...updatedAccountBalances[keyringAccount.id],
  //         [assetId]: {
  //           amount: newBalance,
  //           unit: asset.unit,
  //         },
  //       };
  //     }

  //     await this.#state.update((state) => ({
  //       ...state,
  //       assets: {
  //         ...state?.assets,
  //         ...updatedAccountBalances,
  //       },
  //     }));

  //     await emitSnapKeyringEvent(snap, KeyringEvent.AccountBalancesUpdated, {
  //       balances: updatedAccountBalances,
  //     });

  //     return updatedAccountBalances;
  //   }
}
