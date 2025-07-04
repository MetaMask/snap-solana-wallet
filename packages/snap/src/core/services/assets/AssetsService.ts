import type { Balance } from '@metamask/keyring-api';
import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { FungibleAssetMarketData } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';
import { Duration, parseCaipAssetType } from '@metamask/utils';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import type { Address } from '@solana/kit';
import { address as asAddress } from '@solana/kit';
import { map, uniq } from 'lodash';

import type { SolanaKeyringAccount } from '../../../entities';
import type { ICache } from '../../caching/ICache';
import { useCache } from '../../caching/useCache';
import {
  Network,
  SolanaCaip19Tokens,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '../../constants/solana';
import type {
  GetTokenAccountsByOwnerResponse,
  TokenAccountInfoWithJsonData,
} from '../../sdk-extensions/rpc-api';
import type { Serializable } from '../../serialization/types';
import { diffArrays } from '../../utils/diffArrays';
import { diffObjects } from '../../utils/diffObjects';
import { fromTokenUnits } from '../../utils/fromTokenUnit';
import { getNetworkFromToken } from '../../utils/getNetworkFromToken';
import type { ILogger } from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import type { ConfigProvider } from '../config';
import type { SolanaConnection } from '../connection';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import type { TokenPricesService } from '../token-prices/TokenPrices';

/**
 * Extends a token account as returned by the `getTokenAccountsByOwner` RPC method with the scope and the caip-19 asset type for convenience.
 */
type TokenAccountWithMetadata =
  GetTokenAccountsByOwnerResponse<TokenAccountInfoWithJsonData>[number] & {
    scope: Network;
    assetType: CaipAssetType;
  } & Serializable;

export class AssetsService {
  readonly #logger: ILogger;

  readonly #connection: SolanaConnection;

  readonly #configProvider: ConfigProvider;

  readonly #state: IStateManager<UnencryptedStateValue>;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #tokenPricesService: TokenPricesService;

  readonly #cache: ICache<Serializable>;

  public static readonly cacheTtlsMilliseconds = {
    tokenAccountsByOwner: 5 * Duration.Second,
  };

  constructor({
    connection,
    logger,
    configProvider,
    state,
    tokenMetadataService,
    tokenPricesService,
    cache,
  }: {
    connection: SolanaConnection;
    logger: ILogger;
    configProvider: ConfigProvider;
    state: IStateManager<UnencryptedStateValue>;
    tokenMetadataService: TokenMetadataService;
    tokenPricesService: TokenPricesService;
    cache: ICache<Serializable>;
  }) {
    this.#logger = logger;
    this.#connection = connection;
    this.#configProvider = configProvider;
    this.#state = state;
    this.#tokenMetadataService = tokenMetadataService;
    this.#tokenPricesService = tokenPricesService;
    this.#cache = cache;
  }

  /**
   * Fetches and returns the list of assets for the given account in all Solana networks. Includes native and token assets.
   *
   * @param account - The account to get the assets for.
   * @returns CAIP-19 assets ids.
   */
  async listAccountAssets(
    account: SolanaKeyringAccount,
  ): Promise<CaipAssetType[]> {
    const { activeNetworks } = this.#configProvider.get();

    const nativeAssetTypes = activeNetworks.map(
      (network) => `${network}/${SolanaCaip19Tokens.SOL}` as CaipAssetType,
    );

    const tokenAssetTypes = (
      await this.#getTokenAccountsByOwnerMultiple(
        asAddress(account.address),
        [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
        activeNetworks,
      )
    ).flatMap((response) => response.assetType);

    return [...nativeAssetTypes, ...tokenAssetTypes];
  }

  /**
   * Matrix-fetches all token accounts owned by the given address on the specified networks and program ids,
   * and merges the results into a single array. Each individual token is augmented with the scope and the caip-19 asset type for convenience.
   *
   * It caches the results for each pair of scope and program id.
   *
   * @param owner - The owner of the token accounts.
   * @param programIds - The program ids to fetch the token accounts for.
   * @param scopes - The networks to fetch the token accounts for.
   * @returns The token accounts augmented with the scope and the caip-19 asset type for convenience.
   */
  async #getTokenAccountsByOwnerMultiple(
    owner: Address,
    programIds: Address[] = [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
    scopes: Network[] = [Network.Mainnet],
  ): Promise<TokenAccountWithMetadata[]> {
    if (programIds.length === 0 || scopes.length === 0) {
      return [];
    }

    // Create all pairs of scope and program id
    const pairs = scopes.flatMap((scope) =>
      programIds.map((programId) => ({ scope, programId })),
    );

    const getTokenAccountsByOwnerCached = useCache<
      [Address, Address, Network],
      TokenAccountWithMetadata[]
    >(this.#getTokenAccountsByOwner.bind(this), this.#cache, {
      functionName: 'AssetsService:getTokenAccountsByOwner',
      ttlMilliseconds: AssetsService.cacheTtlsMilliseconds.tokenAccountsByOwner,
    });

    const responses = await Promise.all(
      pairs.map(async ({ scope, programId }) => {
        const response = await getTokenAccountsByOwnerCached(
          owner,
          programId,
          scope,
        );
        return response;
      }),
    );

    return responses.flat();
  }

  /**
   * Fetches the token accounts for the given owner and program id on the specified scope.
   *
   * @param owner - The owner of the token accounts.
   * @param programId - The program id to fetch the token accounts for.
   * @param scope - The scope to fetch the token accounts for.
   * @returns The token accounts augmented with the scope and the caip-19 asset type for convenience.
   */
  async #getTokenAccountsByOwner(
    owner: Address,
    programId: Address = TOKEN_PROGRAM_ADDRESS,
    scope: Network = Network.Mainnet,
  ): Promise<TokenAccountWithMetadata[]> {
    const response = await this.#connection
      .getRpc(scope)
      .getTokenAccountsByOwner(owner, { programId }, { encoding: 'jsonParsed' })
      .send();

    const tokens = response.value;

    // Attach the scope and the caip-19 asset type to each token account for easier future reference
    return tokens.map(
      (token) =>
        ({
          ...token,
          scope,
          assetType: tokenAddressToCaip19(
            scope,
            token.account.data.parsed.info.mint,
          ),
        }) as TokenAccountWithMetadata,
    );
  }

  /**
   * Fetches and returns the balances and metadata of the given account for the given assets.
   *
   * @param account - The account to get the balances for.
   * @param assetTypes - The asset types to get the balances for (CAIP-19 ids).
   * @returns The balances and metadata of the account for the given assets.
   */
  async getAccountBalances(
    account: SolanaKeyringAccount,
    assetTypes: CaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    const accountAddress = asAddress(account.address);
    const tokensMetadata =
      await this.#tokenMetadataService.getTokensMetadata(assetTypes);

    const scopes = uniq(map(assetTypes, getNetworkFromToken));
    const programIds = [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS];
    const tokenAccounts = await this.#getTokenAccountsByOwnerMultiple(
      accountAddress,
      programIds,
      scopes,
    );

    const balances: Record<CaipAssetType, Balance> = {};

    // For each requested asset type, retrieve the balance and metadata, and store that in the balances object
    const promises = assetTypes.map(async (assetType) => {
      const { chainId } = parseCaipAssetType(assetType);
      const isNative = assetType.endsWith(SolanaCaip19Tokens.SOL);

      let balance: bigint;

      if (isNative) {
        balance = (
          await this.#connection
            .getRpc(chainId as Network)
            .getBalance(accountAddress)
            .send()
        ).value;
      } else {
        const tokenAccount = tokenAccounts.find(
          (item: any) => item.assetType === assetType,
        );

        balance = tokenAccount
          ? BigInt(tokenAccount.account.data.parsed.info.tokenAmount.amount)
          : BigInt(0); // If the user has no token account linked to a requested mint, default to 0
      }

      const metadata = tokensMetadata[assetType];

      const amount = fromTokenUnits(balance, metadata?.units[0]?.decimals ?? 9);

      balances[assetType] = { amount, unit: metadata?.symbol ?? 'UNKNOWN' };
    });

    await Promise.all(promises);

    const previousAssets = await this.#state.getKey<
      UnencryptedStateValue['assets']
    >(`assets.${account.id}`);

    const updatedAssets = {
      ...previousAssets,
      ...balances,
    };
    await this.#state.setKey(`assets.${account.id}`, updatedAssets);

    return balances;
  }

  /**
   * Fetches the assets for the given accounts and updates the state accordingly. Also emits events for any changes.
   *
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

    const assets =
      (await this.#state.getKey<UnencryptedStateValue['assets']>('assets')) ??
      {};

    for (const account of accounts) {
      this.#logger.log(
        `[AssetsService] Fetching all assets for ${account.address} in all networks`,
      );
      const accountAssets = await this.listAccountAssets(account);
      const previousAssets = assets[account.id];
      const previousCaip19Assets = Object.keys(
        previousAssets ?? {},
      ) as CaipAssetType[];
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
              added: assetsAdded,
              removed: assetsDeleted,
            },
          },
        });
      }

      const accountBalances = await this.getAccountBalances(
        account,
        accountAssets,
      );

      const previousBalances = assets[account.id];

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

        await this.#state.setKey(`assets.${account.id}`, accountBalances);
      }
    }
  }

  async getAssetsMarketData(
    assets: {
      asset: CaipAssetType;
      unit: CaipAssetType;
    }[],
  ): Promise<
    Record<CaipAssetType, Record<CaipAssetType, FungibleAssetMarketData>>
  > {
    const marketData =
      await this.#tokenPricesService.getMultipleTokensMarketData(assets);
    return marketData;
  }
}
