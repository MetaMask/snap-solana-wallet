/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Balance } from '@metamask/keyring-api';
import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { CaipAssetType } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';
import { Duration, parseCaipAssetType } from '@metamask/utils';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import type { Address, JsonParsedTokenAccount } from '@solana/kit';
import { address as asAddress } from '@solana/kit';
import { map, uniq } from 'lodash';

import type { ICache } from '../../caching/ICache';
import { useCache } from '../../caching/useCache';
import {
  Network,
  SolanaCaip19Tokens,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '../../constants/solana';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import type { Serializable } from '../../serialization/types';
import type { SolanaAsset } from '../../types/solana';
import { diffArrays } from '../../utils/diffArrays';
import { diffObjects } from '../../utils/diffObjects';
import { fromTokenUnits } from '../../utils/fromTokenUnit';
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
    cache,
  }: {
    connection: SolanaConnection;
    logger: ILogger;
    configProvider: ConfigProvider;
    state: IStateManager<UnencryptedStateValue>;
    tokenMetadataService: TokenMetadataService;
    cache: ICache<Serializable>;
  }) {
    this.#logger = logger;
    this.#connection = connection;
    this.#configProvider = configProvider;
    this.#state = state;
    this.#tokenMetadataService = tokenMetadataService;
    this.#cache = cache;
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

    const tokensResponsePromises = this.getTokenAccountsByOwnerMultiple_CACHED(
      asAddress(account.address),
      [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
      activeNetworks,
    );

    const [nativeResponses, tokensResponses] = await Promise.all([
      Promise.all(nativeResponsePromises),
      tokensResponsePromises,
    ]);

    const nativeAssets = nativeResponses.map((response) => response.assetType);
    const tokenAssets = tokensResponses.flatMap(
      (response: any) => response.assetType,
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
      assetType: `${scope}/${SolanaCaip19Tokens.SOL}`,
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
                programId: TOKEN_PROGRAM_ADDRESS,
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
                programId: TOKEN_2022_PROGRAM_ADDRESS,
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
      assetType: tokenAddressToCaip19(scope, token.mint),
      balance: token.tokenAmount.amount,
      decimals: token.tokenAmount.decimals,
      native: token.isNative,
    };
  }

  /**
   * Discovers all token accounts owned by the given address on the specified networks and program ids
   * by calling the `getTokenAccountsByOwner` RPC method.
   *
   * @param owner - The owner of the token accounts.
   * @param programIds - The program ids to fetch the token accounts for.
   * @param scopes - The networks to fetch the token accounts for.
   * @returns The token accounts augmented with the scope and the caip-19 asset type for convenience.
   */
  async getTokenAccountsByOwnerMultiple_CACHED(
    owner: Address,
    programIds: Address[] = [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
    scopes: Network[] = [Network.Mainnet],
  ): Promise<any> {
    // Create all pairs of scope and program id
    const pairs = scopes.flatMap((scope) =>
      programIds.map((programId) => ({ scope, programId })),
    );

    const responses = await Promise.all(
      pairs.map(async ({ scope, programId }) => {
        const response = await this.#getTokenAccountsByOwner_CACHED(
          owner,
          programId,
          scope,
        );
        return response;
      }),
    );

    return responses.flat();
  }

  async getTokenAccountsByOwner(
    owner: Address,
    programId: Address = TOKEN_PROGRAM_ADDRESS,
    scope: Network = Network.Mainnet,
  ): Promise<any> {
    const response = await this.#connection
      .getRpc(scope)
      .getTokenAccountsByOwner(owner, { programId }, { encoding: 'jsonParsed' })
      .send();

    // Attach the scope and the caip-19 asset type to each token account for easier future reference
    return response.value.map((token) => ({
      ...token,
      scope,
      assetType: tokenAddressToCaip19(
        scope,
        token.account.data.parsed.info.mint,
      ),
    }));
  }

  async #getTokenAccountsByOwner_CACHED(
    owner: Address,
    programId: Address = TOKEN_PROGRAM_ADDRESS,
    scope: Network = Network.Mainnet,
  ): Promise<any> {
    return useCache(this.getTokenAccountsByOwner.bind(this), this.#cache, {
      functionName: 'AssetsService:getTokenAccountsByOwner',
      ttlMilliseconds: AssetsService.cacheTtlsMilliseconds.tokenAccountsByOwner,
    })(owner, programId, scope);
  }

  /**
   * Returns the balances and metadata of the given account for the given assets.
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
    const tokensMetadata = await this.#tokenMetadataService.getTokensMetadata(
      assetTypes,
    );

    const scopes = uniq(map(assetTypes, getNetworkFromToken));
    const programIds = [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS];
    const tokenAccounts = await this.getTokenAccountsByOwnerMultiple_CACHED(
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

    // Create all pairs of scope and program id
    const pairs = scopes.flatMap((scope) =>
      programIds.map((programId) => ({ scope, programId })),
    );

    const cacheKeysToDelete = pairs.map(
      ({ scope, programId }) =>
        `AssetsService:getTokenAccountsByOwner:"${accountAddress}":"${programId}":"${scope}"`, // Default cache key generated by useCache uses, which add double quotes around the keys
    );

    await this.#cache.mdelete(cacheKeysToDelete);

    return balances;
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

    const assets =
      (await this.#state.getKey<UnencryptedStateValue['assets']>('assets')) ??
      {};

    for (const account of accounts) {
      this.#logger.log(
        `[AssetsService] Fetching all assets for ${account.address} in all networks`,
      );
      const accountAssets = await this.listAccountAssets(account);
      const previousAssets = assets[account.id];
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
}
