import type { Balance } from '@metamask/keyring-api';
import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { CaipAssetType } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';
import type { GetTransactionApi, JsonParsedTokenAccount } from '@solana/kit';
import { address as asAddress } from '@solana/kit';

import type { SolanaTokenMetadata } from '../../clients/token-metadata-client/types';
import type { Network } from '../../constants/solana';
import {
  Networks,
  SOL_SYMBOL,
  SolanaCaip19Tokens,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '../../constants/solana';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import type { SolanaAsset } from '../../types/solana';
import { lamportsToSol } from '../../utils/conversion';
import { diffArrays } from '../../utils/diffArrays';
import { diffObjects } from '../../utils/diffObjects';
import { fromTokenUnits } from '../../utils/fromTokenUnit';
import { getAccountIdFromAddress } from '../../utils/getAccountIdFromAddress';
import { getNetworkFromToken } from '../../utils/getNetworkFromToken';
import type { ILogger } from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import type { ConfigProvider } from '../config';
import type { SolanaConnection } from '../connection';
import {
  GetBalanceResponseStruct,
  GetTokenAccountsByOwnerResponseStruct,
} from '../connection/structs';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';

export class AssetsService {
  readonly #logger: ILogger;

  readonly #connection: SolanaConnection;

  readonly #configProvider: ConfigProvider;

  readonly #state: IStateManager<UnencryptedStateValue>;

  readonly #tokenMetadataService: TokenMetadataService;

  constructor({
    connection,
    logger,
    configProvider,
    state,
    tokenMetadataService,
  }: {
    connection: SolanaConnection;
    logger: ILogger;
    configProvider: ConfigProvider;
    state: IStateManager<UnencryptedStateValue>;
    tokenMetadataService: TokenMetadataService;
  }) {
    this.#logger = logger;
    this.#connection = connection;
    this.#configProvider = configProvider;
    this.#state = state;
    this.#tokenMetadataService = tokenMetadataService;
  }

  /**
   * Returns the list of assets for the given account in all Solana networks. Includes native and token assets.
   * @param account - The account to get the assets for.
   * @returns CAIP-19 assets ids.
   */
  async listAccountAssets(
    account: SolanaKeyringAccount,
  ): Promise<CaipAssetType[]> {
    const { activeNetworks } = this.#configProvider.get();

    const nativeResponsePromises = activeNetworks.map(async (network) =>
      this.getNativeAsset(account.address, network),
    );
    const tokensResponsePromises = activeNetworks.map(async (network) =>
      this.discoverTokens(account.address, network),
    );

    const [nativeResponses, tokensResponses] = await Promise.all([
      Promise.all(nativeResponsePromises),
      Promise.all(tokensResponsePromises),
    ]);

    const nativeAssets = nativeResponses.map((response) => response.address);
    const tokenAssets = tokensResponses.flatMap((response) =>
      response.map((token) => token.address),
    );
    return [...nativeAssets, ...tokenAssets] as CaipAssetType[];
  }

  async discoverTokens(
    address: string,
    scope: Network,
  ): Promise<SolanaAsset[]> {
    const tokens = await this.#getAddressTokenAccounts(address, scope);
    return tokens;
  }

  async getNativeAsset(address: string, scope: Network): Promise<SolanaAsset> {
    const response = await this.#connection
      .getRpc(scope)
      .getBalance(asAddress(address))
      .send();
    assert(response, GetBalanceResponseStruct);
    return {
      scope,
      address: `${scope}/${SolanaCaip19Tokens.SOL}`,
      balance: response.value.toString(),
      decimals: 9,
      native: true,
    };
  }

  async #getAddressTokenAccounts(address: string, scope: Network) {
    try {
      const [tokenProgramResponse, token2022ProgramResponse] =
        await Promise.all([
          this.#connection
            .getRpc(scope)
            .getTokenAccountsByOwner(
              asAddress(address),
              {
                programId: TOKEN_PROGRAM_ID,
              },
              {
                encoding: 'jsonParsed',
              },
            )
            .send(),
          this.#connection
            .getRpc(scope)
            .getTokenAccountsByOwner(
              asAddress(address),
              {
                programId: TOKEN_2022_PROGRAM_ID,
              },
              {
                encoding: 'jsonParsed',
              },
            )
            .send(),
        ]);
      assert(tokenProgramResponse, GetTokenAccountsByOwnerResponseStruct);
      assert(token2022ProgramResponse, GetTokenAccountsByOwnerResponseStruct);

      const tokenProgramAccounts = tokenProgramResponse.value.map((token) =>
        this.#mapRpcSolanaToken(token.account.data.parsed.info, scope),
      );

      const token2022ProgramAccounts = token2022ProgramResponse.value.map(
        (token) =>
          this.#mapRpcSolanaToken(token.account.data.parsed.info, scope),
      );
      return [...tokenProgramAccounts, ...token2022ProgramAccounts];
    } catch (error) {
      this.#logger.error(error, 'Error fetching token accounts');
      throw error;
    }
  }

  #mapRpcSolanaToken(
    token: JsonParsedTokenAccount,
    scope: Network,
  ): SolanaAsset {
    return {
      scope,
      address: tokenAddressToCaip19(scope, token.mint),
      balance: token.tokenAmount.amount,
      decimals: token.tokenAmount.decimals,
      native: token.isNative,
    };
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
        this.getNativeAsset(account.address, currentNetwork),
        this.discoverTokens(account.address, currentNetwork),
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
   * Fetches the assets for the given accounts and updates the state accordingly. Also emits events for any changes.
   * @param accounts - The accounts to refresh the assets for.
   */
  async refreshAssets(accounts: SolanaKeyringAccount[]): Promise<void> {
    if (accounts.length === 0) {
      this.#logger.info('[AssetsService] No accounts found');
      return;
    }

    this.#logger.log(
      `[AssetsService] Refreshing assets for ${accounts.length} accounts`,
    );

    const currentState = await this.#state.get();

    for (const account of accounts) {
      this.#logger.log(
        `[AssetsService] Fetching all assets for ${account.address} in all networks`,
      );
      const accountAssets = await this.listAccountAssets(account);
      const previousAssets = currentState.assets[account.id];
      const previousCaip19Assets = Object.keys(previousAssets ?? {});
      const currentCaip19Assets = accountAssets ?? {};

      // Check if account assets have changed
      const {
        added: assetsAdded,
        deleted: assetsDeleted,
        hasDiff: assetsChanged,
      } = diffArrays(previousCaip19Assets, currentCaip19Assets);

      if (assetsChanged) {
        this.#logger.info(
          { assetsAdded, assetsDeleted, assetsChanged },
          `[refreshAssets] Found updated assets for ${account.address}`,
        );

        await emitSnapKeyringEvent(snap, KeyringEvent.AccountAssetListUpdated, {
          assets: {
            [account.id]: {
              added: assetsAdded as CaipAssetType[],
              removed: assetsDeleted as CaipAssetType[],
            },
          },
        });
      }

      const accountBalances = await this.getAccountBalances(
        account,
        accountAssets,
      );

      const previousBalances = currentState.assets[account.id];

      // Check if balances have changed
      const {
        added: balancesAdded,
        deleted: balancesDeleted,
        changed: balancesChanged,
        hasDiff: balancesHaveChange,
      } = diffObjects(previousBalances ?? {}, accountBalances);

      if (balancesHaveChange) {
        this.#logger.info(
          { balancesAdded, balancesDeleted, balancesChanged },
          `[BalancesService] Found updated balances for ${account.address}`,
        );

        await emitSnapKeyringEvent(snap, KeyringEvent.AccountBalancesUpdated, {
          balances: {
            [account.id]: {
              ...balancesAdded,
              ...balancesChanged,
            },
          },
        });

        await this.#state.update((_state) => ({
          ..._state,
          assets: {
            ..._state.assets,
            [account.id]: accountBalances,
          },
        }));
      }
    }
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
}
