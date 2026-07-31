/* eslint-disable jsdoc/require-returns */
/* eslint-disable jsdoc/check-indentation */
import {
  KeyringEvent,
  type AccountAssetListUpdatedEvent,
  type AccountBalancesUpdatedEvent,
  type Balance,
} from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { Duration, parseCaipAssetType } from '@metamask/utils';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import type {
  AccountInfoBase,
  AccountInfoWithPubkey,
  Address,
} from '@solana/kit';
import { address as asAddress } from '@solana/kit';

import type {
  AssetEntity,
  NativeAsset,
  SolanaKeyringAccount,
  TokenAsset,
} from '../../../../entities';
import type { ICache } from '../../../caching/ICache';
import { useCache } from '../../../caching/useCache';
import type { NftApiClient } from '../../../clients/nft-api/NftApiClient';
import type { TokenApiClient } from '../../../clients/token-api-client/TokenApiClient';
import type {
  NativeCaipAssetType,
  NftCaipAssetType,
  TokenCaipAssetType,
} from '../../../constants/solana';
import { Network, SolanaCaip19Tokens } from '../../../constants/solana';
import type { TokenAccountInfoWithJsonData } from '../../../sdk-extensions/rpc-api';
import type { Serializable } from '../../../serialization/types';
import { fromTokenUnits } from '../../../utils/fromTokenUnit';
import { getNetworkFromToken } from '../../../utils/getNetworkFromToken';
import { createPrefixedLogger, type ILogger } from '../../../utils/logger';
import { tokenAddressToCaip19 } from '../../../utils/tokenAddressToCaip19';
import type { AccountsService } from '../../accounts/AccountsService';
import type { ConfigProvider } from '../../config';
import type { SolanaConnection } from '../../connection';
import type { AssetsRepository } from '../AssetsRepository';

/**
 * Extends a token account as returned by the `getTokenAccountsByOwner` RPC method with the scope and the caip-19 asset type for convenience.
 */
type TokenAccountWithMetadata = {
  token: AccountInfoWithPubkey<AccountInfoBase & TokenAccountInfoWithJsonData>;
  scope: Network;
  assetType: TokenCaipAssetType;
  keyringAccount: SolanaKeyringAccount;
} & Serializable;

export class SnapAssetsAdapter {
  readonly #logger: ILogger;

  readonly #connection: SolanaConnection;

  readonly #configProvider: ConfigProvider;

  readonly #assetsRepository: AssetsRepository;

  readonly #accountsService: AccountsService;

  readonly #tokenApiClient: TokenApiClient;

  readonly #cache: ICache<Serializable>;

  readonly #nftApiClient: NftApiClient;

  public static readonly cacheTtlsMilliseconds = {
    tokenAccountsByOwner: 5 * Duration.Second,
  };

  constructor({
    connection,
    logger,
    configProvider,
    assetsRepository,
    accountsService,
    tokenApiClient,
    cache,
    nftApiClient,
  }: {
    connection: SolanaConnection;
    logger: ILogger;
    configProvider: ConfigProvider;
    assetsRepository: AssetsRepository;
    accountsService: AccountsService;
    tokenApiClient: TokenApiClient;
    cache: ICache<Serializable>;
    nftApiClient: NftApiClient;
  }) {
    this.#logger = createPrefixedLogger(logger, '[🪙 SnapAssetsAdapter]');
    this.#connection = connection;
    this.#configProvider = configProvider;
    this.#assetsRepository = assetsRepository;
    this.#accountsService = accountsService;
    this.#tokenApiClient = tokenApiClient;
    this.#cache = cache;
    this.#nftApiClient = nftApiClient;
  }

  /**
   * Matrix-fetches all token accounts owned by the given address on the specified networks and program ids,
   * and merges the results into a single array. Each individual token is augmented with the scope and the caip-19 asset type for convenience.
   *
   * It caches the results for each pair of scope and program id.
   *
   * @param accounts - The owners of the token accounts.
   * @param programIds - The program ids to fetch the token accounts for.
   * @param scopes - The networks to fetch the token accounts for.
   * @returns The token accounts augmented with the scope and the caip-19 asset type for convenience.
   */
  async #fetchTokenAccountsMultiple(
    accounts: SolanaKeyringAccount[],
    programIds: Address[] = [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
    scopes: Network[] = [Network.Mainnet],
  ): Promise<TokenAccountWithMetadata[]> {
    if (programIds.length === 0 || scopes.length === 0) {
      return [];
    }

    // Create all combinations of account, programId, and scope
    const combinations = accounts.flatMap((account) =>
      programIds.flatMap((programId) =>
        scopes.map((scope) => ({ account, programId, scope })),
      ),
    );

    const fetchTokenAccountsCached = useCache<
      [SolanaKeyringAccount, Address, Network],
      TokenAccountWithMetadata[]
    >(this.#fetchTokenAccounts.bind(this), this.#cache, {
      functionName: 'SnapAssetsAdapter:fetchTokenAccounts',
      ttlMilliseconds:
        SnapAssetsAdapter.cacheTtlsMilliseconds.tokenAccountsByOwner,
      generateCacheKey: (functionName, args) => {
        const [account, programId, scope] = args;
        return `${functionName}:${account.id}:${programId}:${scope}`;
      },
    });

    const responses = await Promise.allSettled(
      combinations.map(async ({ account, programId, scope }) => {
        const response = await fetchTokenAccountsCached(
          account,
          programId,
          scope,
        );
        return response;
      }),
    );

    return responses.flatMap((item) =>
      item.status === 'fulfilled' ? item.value : [],
    );
  }

  /**
   * Fetches the token accounts for the given owner and program id on the specified scope.
   *
   * @param account - The owner of the token accounts.
   * @param programId - The program id to fetch the token accounts for.
   * @param scope - The scope to fetch the token accounts for.
   * @returns The token accounts augmented with the scope and the caip-19 asset type for convenience.
   */
  async #fetchTokenAccounts(
    account: SolanaKeyringAccount,
    programId: Address = TOKEN_PROGRAM_ADDRESS,
    scope: Network = Network.Mainnet,
  ): Promise<TokenAccountWithMetadata[]> {
    const response = await this.#connection
      .getRpc(scope)
      .getTokenAccountsByOwner(
        asAddress(account.address),
        { programId },
        { encoding: 'jsonParsed' },
      )
      .send();

    const tokens = response.value;

    // Attach the scope and the caip-19 asset type to each token account for easier future reference
    return tokens.map(
      (token) =>
        ({
          token,
          scope,
          assetType: tokenAddressToCaip19(
            scope,
            token.account.data.parsed.info.mint,
          ),
          keyringAccount: account,
        }) as TokenAccountWithMetadata,
    );
  }

  /**
   * Fetches all assets for the given account.
   *
   * @param account - The account to get the balances for.
   * @returns The balances and metadata of the account for the given assets.
   */
  async fetch(account: SolanaKeyringAccount): Promise<AssetEntity[]> {
    const [nativeAssets, tokenAccounts] = await Promise.all([
      this.#fetchNativeAssets(account),
      this.#fetchTokenAccountsMultiple(
        [account],
        [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
        await this.#configProvider.getActiveNetworks(),
      ),
    ]);

    const assetTypes = tokenAccounts.map(
      (tokenAccount) => tokenAccount.assetType,
    );

    const tokensMetadata =
      await this.#tokenApiClient.getTokensMetadata(assetTypes);

    const tokenAssets: TokenAsset[] = tokenAccounts
      .filter((tokenAccount) => tokenAccount.assetType.includes('/token:'))
      .map((tokenAccount) => {
        const { assetType } = tokenAccount;
        const { decimals, amount, uiAmountString } =
          tokenAccount.token.account.data.parsed.info.tokenAmount;

        return {
          assetType,
          keyringAccountId: tokenAccount.keyringAccount.id,
          network: tokenAccount.scope,
          mint: tokenAccount.token.account.data.parsed.info.mint,
          pubkey: tokenAccount.token.pubkey,
          symbol: tokensMetadata[assetType]?.symbol ?? 'UNKNOWN',
          decimals,
          rawAmount: amount,
          uiAmount: uiAmountString ?? fromTokenUnits(amount, decimals),
        };
      });

    // const nftAssets = await this.#fetchNftAssets(account, tokenAccounts.filter(
    //   (token) => token.assetType.includes('/nft:'),
    // ));

    return [
      ...nativeAssets,
      ...tokenAssets,
      // ...nftAssets,
    ];
  }

  async getNativeAssetTypes(): Promise<NativeCaipAssetType[]> {
    const activeNetworks = await this.#configProvider.getActiveNetworks();
    return activeNetworks.map(
      (network) => `${network}/${SolanaCaip19Tokens.SOL}` as const,
    );
  }

  async #fetchNativeAssets(
    account: SolanaKeyringAccount,
  ): Promise<NativeAsset[]> {
    const nativeAssetsTypes = await this.getNativeAssetTypes();

    const accountAddress = asAddress(account.address);

    const balancePromises = nativeAssetsTypes.map(async (assetType) => {
      const balance = await this.#connection
        .getRpc(getNetworkFromToken(assetType))
        .getBalance(accountAddress)
        .send();

      return {
        assetType,
        keyringAccountId: account.id,
        network: getNetworkFromToken(assetType),
        address: accountAddress,
        symbol: 'SOL',
        decimals: 9,
        rawAmount: balance.value.toString(),
        uiAmount: fromTokenUnits(balance.value, 9),
      };
    });

    const results = (await Promise.allSettled(balancePromises)).flatMap(
      (item) => (item.status === 'fulfilled' ? item.value : []),
    );

    return results;
  }

  async #fetchNftAssets(
    account: SolanaKeyringAccount,
    assetIds: NftCaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    const accountAddress = asAddress(account.address);

    const nftAssets =
      await this.#nftApiClient.listAddressSolanaNfts(accountAddress);
    const balances: Record<CaipAssetType, Balance> = {};

    for (const assetId of assetIds) {
      const { assetReference } = parseCaipAssetType(assetId);

      const nftAsset = nftAssets.find(
        (nft) => nft.tokenAddress === assetReference,
      );

      if (!nftAsset) {
        continue;
      }

      balances[assetId] = {
        unit: nftAsset.nftToken.name,
        amount: nftAsset.balance.toString(),
      };
    }

    return balances;
  }

  async save(asset: AssetEntity): Promise<void> {
    await this.saveMany([asset]);
  }

  async saveMany(assets: AssetEntity[]): Promise<void> {
    this.#logger.info('Saving assets', assets);

    /**
     * Should we save the assets incrementally?
     * - If true, only saves and emits events for the assets that have changed (new or balance changed). Better performance because it only informs the client of what has changed.
     * - If false, saves all assets. More reliable because it enforces that the client has the same state of assets as the snap.
     */
    const isIncremental = false;

    const hasZeroAmount = (asset: AssetEntity) =>
      asset.rawAmount === '0' || asset.uiAmount === '0';

    const hasNonZeroAmount = (asset: AssetEntity) => !hasZeroAmount(asset);

    const savedAssets = await this.getAll();

    // Save assets using repository
    await this.#assetsRepository.saveMany(assets);

    // Notify the extension about the new assets in a single event
    const isNew = (asset: AssetEntity) =>
      !savedAssets.find(
        (item) =>
          item.keyringAccountId === asset.keyringAccountId &&
          item.assetType === asset.assetType,
      );

    const wasSavedWithZeroAmount = (asset: AssetEntity) => {
      const savedAsset = savedAssets.find(
        (item) =>
          item.keyringAccountId === asset.keyringAccountId &&
          item.assetType === asset.assetType,
      );

      return savedAsset && hasZeroAmount(savedAsset);
    };

    const isNativeAsset = (asset: AssetEntity) =>
      asset.assetType.includes(SolanaCaip19Tokens.SOL);

    const shouldBeInRemovedList = (asset: AssetEntity) =>
      hasZeroAmount(asset) && !isNativeAsset(asset); // Never remove native assets from the account asset list

    const shouldBeInAddedList = (asset: AssetEntity) =>
      !shouldBeInRemovedList(asset) &&
      (!isIncremental ||
        ((isNew(asset) || wasSavedWithZeroAmount(asset)) &&
          hasNonZeroAmount(asset)));

    const assetListUpdatedPayload = assets.reduce<
      AccountAssetListUpdatedEvent['params']['assets']
    >(
      (acc, asset) => ({
        ...acc,
        [asset.keyringAccountId]: {
          added: [
            ...(acc[asset.keyringAccountId]?.added ?? []),
            ...(shouldBeInAddedList(asset) ? [asset.assetType] : []),
          ],
          removed: [
            ...(acc[asset.keyringAccountId]?.removed ?? []),
            ...(shouldBeInRemovedList(asset) ? [asset.assetType] : []),
          ],
        },
      }),
      {},
    );

    // If no assets were added or removed, don't emit the event.
    const isEmptyAccountAssetListUpdatedPayload = Object.values(
      assetListUpdatedPayload,
    )
      .map((item) => item.added.length + item.removed.length)
      .every((item) => item === 0);

    if (!isEmptyAccountAssetListUpdatedPayload) {
      await emitSnapKeyringEvent(snap, KeyringEvent.AccountAssetListUpdated, {
        assets: assetListUpdatedPayload,
      });
    }

    // Notify the extension about the changed balances in a single event

    const hasChanged = (asset: AssetEntity) =>
      SnapAssetsAdapter.hasChanged(asset, savedAssets);

    /**
     * Build the event payload for snap keyring event `AccountBalancesUpdated`.
     *
     * @example
     * {
     *   "balances": {
     *     "keyringAccountId0": {
     *       "assetType00": {
     *         "unit": "XYZ",
     *         "amount": "1234"
     *       },
     *       "assetType01": {
     *         "unit": "ABC",
     *         "amount": "5678"
     *       }
     *     },
     *     "keyringAccountId1": {
     *       "assetType10": {
     *         "unit": "XYZ",
     *         "amount": "42"
     *       }
     *     }
     *   }
     * }
     */
    const balancesUpdatedPayload = assets
      .filter(isIncremental ? hasChanged : () => true)
      .reduce<AccountBalancesUpdatedEvent['params']['balances']>(
        (acc, asset) => ({
          ...acc,
          [asset.keyringAccountId]: {
            ...(acc[asset.keyringAccountId] ?? {}),
            [asset.assetType]: {
              unit: asset.symbol,
              amount: asset.uiAmount,
            },
          },
        }),
        {},
      );

    // Traverse the balancesUpdatedPayload object to check if we have at least 1 account that has at least 1 balance updated.
    const isSomeBalanceChanged = Object.values(balancesUpdatedPayload)
      .map((accountAssets) => Object.keys(accountAssets).length) // To each accountAssets object, map the number of assetTypes
      .some((count) => count > 0);

    // Only emit the event if some balance was changed.
    if (isSomeBalanceChanged) {
      await emitSnapKeyringEvent(snap, KeyringEvent.AccountBalancesUpdated, {
        balances: balancesUpdatedPayload,
      });
    }
  }

  /**
   * Checks if the asset has changed compared to passed assets lookup.
   *
   * @param asset - The asset to check.
   * @param assetsLookup - The lookup table to check against.
   * @returns True if the asset has changed, false otherwise.
   */
  static hasChanged(asset: AssetEntity, assetsLookup: AssetEntity[]): boolean {
    const savedAsset = assetsLookup.find(
      (item) =>
        item.keyringAccountId === asset.keyringAccountId &&
        item.assetType === asset.assetType,
    );

    if (!savedAsset) {
      return true;
    }

    const rawAmountChanged = savedAsset.rawAmount !== asset.rawAmount;
    const uiAmountChanged = savedAsset.uiAmount !== asset.uiAmount;

    return rawAmountChanged || uiAmountChanged;
  }

  async getAll(): Promise<AssetEntity[]> {
    return this.#assetsRepository.getAll();
  }

  /**
   * Returns a single account asset by CAIP-19 ID, or `null` if missing.
   *
   * @param accountId - Keyring account ID.
   * @param assetId - CAIP-19 asset ID.
   */
  async getAccountAssetByID(
    accountId: string,
    assetId: string,
  ): Promise<AssetEntity | null> {
    const { chainId } = parseCaipAssetType(assetId as CaipAssetType);

    const assets = await this.getAccountAssetsByScope(
      chainId as Network,
      accountId,
    );

    return assets.find((asset) => asset.assetType === assetId) ?? null;
  }

  /**
   * Returns account assets for the given CAIP-19 IDs, keyed by asset ID.
   * Missing assets are `null`.
   *
   * @param accountId - Keyring account ID.
   * @param assetIds - CAIP-19 asset IDs to resolve.
   */
  async getAccountAssetsByIDs(
    accountId: string,
    assetIds: string[],
  ): Promise<Record<string, AssetEntity | null>> {
    if (assetIds.length === 0) {
      return {};
    }

    const account = await this.#accountsService.findById(accountId);

    if (!account) {
      return Object.fromEntries(assetIds.map((assetId) => [assetId, null]));
    }

    const accountAssets = await this.findByAccount(account);

    return Object.fromEntries(
      assetIds.map((assetId) => [
        assetId,
        accountAssets.find((asset) => asset.assetType === assetId) ?? null,
      ]),
    );
  }

  /**
   * Returns controller-backed assets for an account on the given Solana scope.
   *
   * @param scope - CAIP-2 chain ID to filter results.
   * @param accountId - Keyring account ID.
   */
  async getAccountAssetsByScope(
    scope: CaipChainId,
    accountId: string,
  ): Promise<AssetEntity[]> {
    const account = await this.#accountsService.findById(accountId);

    if (!account) {
      return [];
    }

    const accountAssets = await this.findByAccount(account);

    return accountAssets.filter((asset) => asset.assetType.startsWith(scope));
  }

  /**
   * Returns assets for an account across all active Solana networks.
   *
   * @param accountId - Keyring account ID.
   */
  async getAccountAssetsForAllActiveScopes(
    accountId: string,
  ): Promise<AssetEntity[]> {
    const activeNetworks = await this.#configProvider.getActiveNetworks();

    const assetsByScope = await Promise.all(
      activeNetworks.map((network) =>
        this.getAccountAssetsByScope(network, accountId),
      ),
    );

    return assetsByScope.flat();
  }

  async findByAccount(account: SolanaKeyringAccount): Promise<AssetEntity[]> {
    const { id: keyringAccountId, address } = account;

    const savedAssets =
      await this.#assetsRepository.findByKeyringAccountId(keyringAccountId);

    // Every account must have at least the native assets. Ensure that they are always present, even if not yet fetched/saved.
    const nativeAssetTypes = await this.getNativeAssetTypes();
    const missingNativeAssets: NativeAsset[] = [];

    for (const nativeAssetType of nativeAssetTypes) {
      const hasNativeAsset = savedAssets.some(
        (asset) => asset.assetType === nativeAssetType,
      );

      if (!hasNativeAsset) {
        // Create a placeholder native asset with zero balance
        // This will be updated when assets are actually fetched
        const network = getNetworkFromToken(nativeAssetType);

        missingNativeAssets.push({
          assetType: nativeAssetType,
          keyringAccountId: account.id,
          network,
          address,
          symbol: 'SOL',
          decimals: 9,
          rawAmount: '0',
          uiAmount: '0',
        });
      }
    }

    return [...savedAssets, ...missingNativeAssets];
  }
}
