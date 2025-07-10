import type { Balance } from '@metamask/keyring-api';
import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type {
  FungibleAssetMarketData,
  FungibleAssetMetadata,
} from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';
import { Duration, parseCaipAssetType } from '@metamask/utils';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import type { Address } from '@solana/kit';
import { address as asAddress } from '@solana/kit';
import { get, map, uniq } from 'lodash';

import type { SolanaKeyringAccount } from '../../../entities';
import type { EventEmitter } from '../../../infrastructure/event-emitter/EventEmitter';
import type { ICache } from '../../caching/ICache';
import { useCache } from '../../caching/useCache';
import type { NftApiClient } from '../../clients/nft-api/NftApiClient';
import type {
  Caip10Address,
  NativeCaipAssetType,
  NftCaipAssetType,
  TokenCaipAssetType,
} from '../../constants/solana';
import { Network, SolanaCaip19Tokens } from '../../constants/solana';
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
import type {
  AccountMonitor,
  AccountMonitoringParams,
  AccountNotification,
} from '../subscriptions/AccountMonitor';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import type { TokenPricesService } from '../token-prices/TokenPrices';
import type { AssetMetadata, NonFungibleAssetMetadata } from './type';

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

  readonly #loggerPrefix = '[🪙 AssetsService]';

  readonly #connection: SolanaConnection;

  readonly #configProvider: ConfigProvider;

  readonly #state: IStateManager<UnencryptedStateValue>;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #tokenPricesService: TokenPricesService;

  readonly #cache: ICache<Serializable>;

  readonly #nftApiClient: NftApiClient;

  readonly #accountMonitor: AccountMonitor;

  readonly #activeNetworks: Network[];

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
    nftApiClient,
    accountMonitor,
    eventEmitter,
  }: {
    connection: SolanaConnection;
    logger: ILogger;
    configProvider: ConfigProvider;
    state: IStateManager<UnencryptedStateValue>;
    tokenMetadataService: TokenMetadataService;
    tokenPricesService: TokenPricesService;
    cache: ICache<Serializable>;
    nftApiClient: NftApiClient;
    accountMonitor: AccountMonitor;
    eventEmitter: EventEmitter;
  }) {
    this.#logger = logger;
    this.#connection = connection;
    this.#configProvider = configProvider;
    this.#state = state;
    this.#tokenMetadataService = tokenMetadataService;
    this.#tokenPricesService = tokenPricesService;
    this.#cache = cache;
    this.#accountMonitor = accountMonitor;
    this.#nftApiClient = nftApiClient;
    this.#activeNetworks = configProvider.get().activeNetworks;

    eventEmitter.on('onStart', this.#monitorAllAccountsAssets.bind(this));
  }

  async #listAddressNativeAssets(): Promise<NativeCaipAssetType[]> {
    const nativeAssetsIds = this.#activeNetworks.map(
      (network) => `${network}/${SolanaCaip19Tokens.SOL}` as const,
    );

    return nativeAssetsIds;
  }

  async #listAddressTokenAssets(
    address: Address,
  ): Promise<TokenCaipAssetType[]> {
    const tokenAccounts = await this.#getTokenAccountsByOwnerMultiple(
      asAddress(address),
      [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
      this.#activeNetworks,
    );
    const tokenIds = tokenAccounts.map(
      (token) => token.assetType,
    ) as TokenCaipAssetType[];

    return tokenIds;
  }

  async #listAddressNftAssets(address: Address): Promise<NftCaipAssetType[]> {
    const nftAssets = await this.#nftApiClient.listAddressSolanaNfts(address);

    const nftAssetsIds = nftAssets.map(
      (nft) => `${Network.Mainnet}/nft:${nft.tokenAddress}` as NftCaipAssetType,
    );

    return nftAssetsIds;
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
    const accountAddress = asAddress(account.address);

    const [nativeAssetsIds, tokenAssetsIds, nftAssetsIds] = await Promise.all([
      this.#listAddressNativeAssets(),
      this.#listAddressTokenAssets(accountAddress),
      this.#listAddressNftAssets(accountAddress),
    ]);

    return uniq([...nativeAssetsIds, ...tokenAssetsIds, ...nftAssetsIds]);
  }

  #splitAssetsByType(assetTypes: CaipAssetType[]) {
    const nativeAssetTypes = assetTypes.filter((assetType) =>
      assetType.endsWith(SolanaCaip19Tokens.SOL),
    ) as NativeCaipAssetType[];
    const tokenAssetTypes = assetTypes.filter((assetType) =>
      assetType.includes('/token:'),
    ) as TokenCaipAssetType[];
    const nftAssetTypes = assetTypes.filter((assetType) =>
      assetType.includes('/nft:'),
    ) as NftCaipAssetType[];

    return { nativeAssetTypes, tokenAssetTypes, nftAssetTypes };
  }

  getNativeTokensMetadata(
    assetTypes: NativeCaipAssetType[],
  ): Record<CaipAssetType, FungibleAssetMetadata | null> {
    const nativeTokensMetadata: Record<
      CaipAssetType,
      FungibleAssetMetadata | null
    > = {};

    for (const assetType of assetTypes) {
      const { chainId } = parseCaipAssetType(assetType);
      nativeTokensMetadata[assetType] = {
        name: 'Solana',
        symbol: 'SOL',
        fungible: true,
        iconUrl: `${this.#configProvider.get().staticApi.baseUrl}/api/v2/tokenIcons/assets/solana/${chainId}/slip44/501.png`,
        units: [
          {
            name: 'Solana',
            symbol: 'SOL',
            decimals: 9,
          },
        ],
      };
    }

    return nativeTokensMetadata;
  }

  async getTokensMetadata(
    assetTypes: TokenCaipAssetType[],
  ): Promise<Record<TokenCaipAssetType, FungibleAssetMetadata | null>> {
    const tokensMetadata =
      await this.#tokenMetadataService.getTokensMetadata(assetTypes);

    return tokensMetadata;
  }

  async getNftsMetadata(
    assetTypes: NftCaipAssetType[],
  ): Promise<Record<NftCaipAssetType, NonFungibleAssetMetadata | null>> {
    const nftsMetadata = await this.#nftApiClient.getNftsMetadata(
      assetTypes.map((assetType) => {
        const { assetReference } = parseCaipAssetType(assetType);
        return assetReference;
      }),
    );

    const nftsMetadataMap: Record<NftCaipAssetType, NonFungibleAssetMetadata> =
      {};

    assetTypes.forEach((assetType, index) => {
      const nftMetadata = nftsMetadata[index];

      if (!nftMetadata) {
        return;
      }

      const metadata = {
        name: nftMetadata.name,
        symbol: nftMetadata.name,
        imageUrl: nftMetadata.imageUrl,
        description: nftMetadata.description,
        fungible: false as const,
        isPossibleSpam: false, // FIXME: The isSpam should be part of the NFT item response, not balance, otherwise we can't get it here
        attributes: Object.fromEntries(
          nftMetadata.attributes.map(
            (attr: { key: string; value: string | number }) => [
              attr.key,
              attr.value,
            ],
          ),
        ),
        collection: {
          name: nftMetadata.collectionName,
          address: nftMetadata.onchainCollectionAddress as Caip10Address,
          symbol: nftMetadata.collectionSymbol,
          tokenCount: nftMetadata.collectionCount,
          creator: '' as Caip10Address, // FIXME: There can be more than one creator
          imageUrl: nftMetadata.collectionImageUrl ?? '',
        },
      };

      nftsMetadataMap[assetType] = metadata;
    });

    return nftsMetadataMap;
  }

  async getAssetsMetadata(
    assetTypes: CaipAssetType[],
  ): Promise<Record<CaipAssetType, AssetMetadata | null>> {
    const { nativeAssetTypes, tokenAssetTypes, nftAssetTypes } =
      this.#splitAssetsByType(assetTypes);

    const [
      nativeTokensMetadata,
      tokensMetadata,
      // nftMetadata,
    ] = await Promise.all([
      this.getNativeTokensMetadata(nativeAssetTypes),
      this.getTokensMetadata(tokenAssetTypes),
      // this.getNftsMetadata(nftAssetTypes),
    ]);

    return {
      ...nativeTokensMetadata,
      ...tokensMetadata,
      // ...nftMetadata,
    };
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
    /**
     * There will be 3 sources of balances data:
     * - The balances for native assets, which are fetched from the RPC
     * - The balances for token assets, which are fetched from the token accounts
     * - The balances for NFT assets, which are always 1
     */
    const { nativeAssetTypes, tokenAssetTypes, nftAssetTypes } =
      this.#splitAssetsByType(assetTypes);

    const [
      nativeBalances,
      tokenBalances,
      // nftBalances
    ] = await Promise.all([
      this.#getNativeBalances(account, nativeAssetTypes),
      this.#getTokenBalances(account, tokenAssetTypes),
      // this.#getNftBalances(account, nftAssetTypes),
    ]);

    return {
      ...nativeBalances,
      ...tokenBalances,
      // ...nftBalances,
    };
  }

  async #getNativeBalances(
    account: SolanaKeyringAccount,
    assetIds: NativeCaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    const accountAddress = asAddress(account.address);

    const balancePromises = assetIds.map(async (assetId) => {
      const balance = await this.#connection
        .getRpc(getNetworkFromToken(assetId))
        .getBalance(accountAddress)
        .send();

      return [
        assetId,
        {
          unit: 'SOL',
          amount: fromTokenUnits(balance.value, 9),
        },
      ] as const;
    });

    const results = await Promise.all(balancePromises);
    return Object.fromEntries(results);
  }

  async #getTokenBalances(
    account: SolanaKeyringAccount,
    assetIds: TokenCaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    const accountAddress = asAddress(account.address);
    const tokensMetadata =
      await this.#tokenMetadataService.getTokensMetadata(assetIds);

    const scopes = uniq(map(assetIds, getNetworkFromToken));
    const programIds = [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS];
    const tokenAccounts = await this.#getTokenAccountsByOwnerMultiple(
      accountAddress,
      programIds,
      scopes,
    );

    const balances: Record<CaipAssetType, Balance> = {};

    // For each requested asset type, retrieve the balance and metadata, and store that in the balances object
    const promises = assetIds.map(async (assetType) => {
      const tokenAccount = tokenAccounts.find(
        (item: any) => item.assetType === assetType,
      );

      const balance = tokenAccount
        ? BigInt(tokenAccount.account.data.parsed.info.tokenAmount.amount)
        : BigInt(0); // If the user has no token account linked to a requested mint, default to 0

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

  async #getNftBalances(
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

  /**
   * Monitors all assets for all accounts in all active networks.
   */
  async #monitorAllAccountsAssets(): Promise<void> {
    const accountsById =
      (await this.#state.getKey<UnencryptedStateValue['keyringAccounts']>(
        'keyringAccounts',
      )) ?? {};

    const accounts = Object.values(accountsById);

    await Promise.allSettled(
      accounts.map(async (account) => {
        await this.monitorAccountAssets(account);
      }),
    );
  }

  /**
   * Monitors all assets for a single account across all active networks.
   * @param account - The account to monitor the assets for.
   */
  async monitorAccountAssets(account: SolanaKeyringAccount): Promise<void> {
    this.#logger.log(
      this.#loggerPrefix,
      'Starting to monitor all assets of account',
      account,
    );

    const { activeNetworks } = this.#configProvider.get();

    const tokenAccounts = await this.#getTokenAccountsByOwnerMultiple(
      asAddress(account.address),
      [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
      activeNetworks,
    );

    // Monitor native assets across all active networks
    const nativeAssetsPromises = activeNetworks.map(async (network) =>
      this.#monitorAccountNativeAsset(account, network),
    );

    // Monitor token assets across all active networks
    const tokenAssetsPromises = tokenAccounts.map(async (tokenAccount) =>
      this.#monitorAccountTokenAsset(account, tokenAccount),
    );

    await Promise.allSettled([...nativeAssetsPromises, ...tokenAssetsPromises]);
  }

  /**
   * Monitors the native asset (SOL) for the given account in the given network.
   * @param account - The account to monitor the native asset for.
   * @param network - The network to monitor the native asset for.
   */
  async #monitorAccountNativeAsset(
    account: SolanaKeyringAccount,
    network: Network,
  ): Promise<void> {
    this.#logger.log(this.#loggerPrefix, 'Monitoring native asset balance', {
      account,
      network,
    });

    // To monitor the native asset (SOL), we need to monitor the user's account
    const { address } = account;

    await this.#accountMonitor.monitor({
      address,
      commitment: 'confirmed',
      network,
      onAccountChanged: async (
        notification: AccountNotification,
        params: AccountMonitoringParams,
      ) => await this.#handleNativeAssetChanged(account, notification, params),
    });
  }

  /**
   * Handles the notification when the account's native asset changed.
   * @param account - The account that the native asset changed for.
   * @param notification - The notification that triggered the event.
   * @param params - The parameters for the event.
   */
  async #handleNativeAssetChanged(
    account: SolanaKeyringAccount,
    notification: AccountNotification,
    params: AccountMonitoringParams,
  ): Promise<void> {
    this.#logger.log(this.#loggerPrefix, 'Native asset balance changed', {
      account,
      notification,
      params,
    });

    const { id: accountId } = account;
    const { network } = params;

    const lamports = notification.value?.lamports;
    if (!lamports) {
      this.#logger.error(
        this.#loggerPrefix,
        'No balance found in account changed event',
        {
          notification,
          params,
        },
      );
      return;
    }

    const balance = {
      amount: fromTokenUnits(lamports, 9),
      unit: 'SOL',
    };

    const assetType = `${network}/${SolanaCaip19Tokens.SOL}`;

    await Promise.allSettled([
      // Update the state
      this.#state.setKey(`assets.${accountId}.${assetType}`, balance),
      // Notify the extension
      emitSnapKeyringEvent(snap, KeyringEvent.AccountBalancesUpdated, {
        balances: {
          [accountId]: {
            [assetType]: balance,
          },
        },
      }),
    ]);
  }

  /**
   * Monitors the token account owned by the given account in the given network.
   * @param account - The account to monitor the token account for.
   * @param tokenAccount - The token account to monitor.
   */
  async #monitorAccountTokenAsset(
    account: SolanaKeyringAccount,
    tokenAccount: TokenAccountWithMetadata,
  ): Promise<void> {
    this.#logger.log(this.#loggerPrefix, 'Monitoring token asset balance', {
      account,
      tokenAccount,
    });

    const { pubkey: address, scope: network } = tokenAccount;

    await this.#accountMonitor.monitor({
      address,
      commitment: 'confirmed',
      network,
      onAccountChanged: async (
        notification: AccountNotification,
        params: AccountMonitoringParams,
      ) => await this.#handleTokenAssetChanged(account, notification, params),
    });
  }

  /**
   * Handles the notification when the account's token account changed.
   * @param account - The account that the token account changed for.
   * @param notification - The notification that triggered the event.
   * @param params - The parameters for the event.
   */
  async #handleTokenAssetChanged(
    account: SolanaKeyringAccount,
    notification: AccountNotification,
    params: AccountMonitoringParams,
  ): Promise<void> {
    this.#logger.log(this.#loggerPrefix, 'Token asset changed', {
      account,
      notification,
      params,
    });

    const { id: accountId } = account;
    const { network } = params;

    const mint = get(notification, 'value.data.parsed.info.mint');
    if (!mint) {
      this.#logger.error(
        this.#loggerPrefix,
        'No mint found in token account changed event',
        { notification, params },
      );
      return;
    }

    const uiAmountString = get(
      notification,
      'value.data.parsed.info.tokenAmount.uiAmountString',
    );
    if (!uiAmountString) {
      this.#logger.error(
        this.#loggerPrefix,
        'No amount found in token account changed event',
        {
          notification,
          params,
        },
      );
      return;
    }

    const assetType = tokenAddressToCaip19(network, mint);

    const balance = {
      amount: uiAmountString,
      /**
       * TODO: I think we can leave empty, because it looks like the extension is not using it.
       * Which is convenient, because we don't have to fetch the token metadata.
       *
       * Either it's a design issue with the API of `KeyringEvent.AccountBalancesUpdated`,
       * in that case it could be relaxed, and the field could become optional.
       *
       * Either it's an implementation issue on the extension side, and we're not using the field
       * as we should.
       */
      unit: '',
    };

    await Promise.allSettled([
      // Update the state
      this.#state.setKey(`assets.${accountId}.${assetType}`, balance),
      // Notify the extension
      emitSnapKeyringEvent(snap, KeyringEvent.AccountBalancesUpdated, {
        balances: {
          [accountId]: {
            [assetType]: balance,
          },
        },
      }),
    ]);
  }

  /**
   * Stops monitoring all assets for a single account across all active networks.
   * @param account - The account to monitor the assets for.
   */
  async stopMonitorAccountAssets(account: SolanaKeyringAccount): Promise<void> {
    this.#logger.log(
      this.#loggerPrefix,
      'Stopping to monitor all assets of account',
      account,
    );

    const { address } = account;
    const { activeNetworks } = this.#configProvider.get();

    const tokenAccounts = await this.#getTokenAccountsByOwnerMultiple(
      asAddress(address),
      [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
      activeNetworks,
    );

    // Stop monitoring native assets across all activeNetworks networks
    const nativeAssetsPromises = activeNetworks.map(async (network) =>
      this.#accountMonitor.stopMonitoring(address, network),
    );

    // Stop monitoring token assets across all active networks
    const tokenAssetsPromises = tokenAccounts.map(async (tokenAccount) =>
      this.#accountMonitor.stopMonitoring(
        tokenAccount.pubkey,
        tokenAccount.scope,
      ),
    );

    await Promise.allSettled([...nativeAssetsPromises, ...tokenAssetsPromises]);
  }
}
