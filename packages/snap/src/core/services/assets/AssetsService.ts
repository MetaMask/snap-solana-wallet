/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Balance } from '@metamask/keyring-api';
import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type { CaipAssetType } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';
import { parseCaipAssetType } from '@metamask/utils';
import {
  fetchMint,
  fetchToken,
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import type { JsonParsedTokenAccount } from '@solana/kit';
import { address as asAddress } from '@solana/kit';

import type { Network } from '../../constants/solana';
import {
  SolanaCaip19Tokens,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '../../constants/solana';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
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

    const nativeAssets = nativeResponses.map((response) => response.assetType);
    const tokenAssets = tokensResponses.flatMap((response) =>
      response.map((token) => token.assetType),
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
   * Returns the balances and metadata of the given account for the given assets.
   * @param account - The account to get the balances for.
   * @param assets - The assets to get the balances for (CAIP-19 ids).
   * @returns The balances and metadata of the account for the given assets.
   */
  async getAccountBalances(
    account: SolanaKeyringAccount,
    assets: CaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    console.log('[💰 getAccountBalances:: started]', account, assets);

    const tokensMetadata = await this.#tokenMetadataService.getTokensMetadata(
      assets,
    );
    console.log('[💰 getAccountBalances:: metadata]', tokensMetadata);

    const balances: Record<CaipAssetType, Balance> = {};

    const promises = assets.map(async (asset) => {
      const balance = await this.getBalance(account, asset);
      const metadata = tokensMetadata[asset];
      const amount = fromTokenUnits(balance, metadata?.units[0]?.decimals ?? 9);
      const unit = metadata?.symbol ?? 'UNKNOWN';
      console.log('[💰 getAccountBalances:: balance]', asset, balance);
      balances[asset] = {
        amount,
        unit,
      };
    });

    await Promise.all(promises);

    await this.#state.setKey(`assets.${account.id}`, balances);

    console.log('[💰 getAccountBalances:: finished]', balances);
    return balances;
  }

  /**
   * Fetches the balance of the given asset (native or SPL token) for the given account.
   *
   * @param account - The account to get the balance for.
   * @param asset - The CAIP-19 type of the asset to get the balance for.
   * @returns The balance of the asset for the given account, as a bigint.
   */
  async getBalance(
    account: SolanaKeyringAccount,
    asset: CaipAssetType,
  ): Promise<bigint> {
    console.log('[💰 getBalance:: asset]', asset);
    const accountAddress = asAddress(account.address);

    const network = getNetworkFromToken(asset);
    const rpc = this.#connection.getRpc(network);

    if (asset.endsWith(SolanaCaip19Tokens.SOL)) {
      console.log('[💰 getBalance:: isSol]');
      const response = await this.#connection
        .getRpc(network)
        .getBalance(accountAddress)
        .send();

      return response.value;
    }

    // Else, it's a SPL token
    console.log('[💰 getBalance:: isSplToken]');
    const mintAddress = asAddress(parseCaipAssetType(asset).assetReference);
    console.log('[💰 getBalance:: mintAddress]', mintAddress);

    // Get the mint account
    const mintAccount = await fetchMint(rpc, mintAddress);
    console.log('[💰 getBalance:: mintAccount]', mintAccount);

    // Get the associated token account address
    const ataAddress = (
      await findAssociatedTokenPda({
        mint: mintAccount.address,
        owner: accountAddress,
        tokenProgram: mintAccount.programAddress,
      })
    )[0];

    // Get the token account
    const tokenAccount = await fetchToken(rpc, ataAddress);
    console.log('[💰 getBalance:: tokenAccount]', tokenAccount);

    return tokenAccount.data.amount;
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
