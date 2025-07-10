import type { CaipAssetType } from '@metamask/snaps-sdk';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { address as asAddress } from '@solana/kit';
import { get } from 'lodash';

import type { SolanaKeyringAccount } from '../../../entities';
import type { EventEmitter } from '../../../infrastructure';
import type { Network } from '../../constants/solana';
import { SolanaCaip19Tokens } from '../../constants/solana';
import { fromTokenUnits } from '../../utils/fromTokenUnit';
import type { ILogger } from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import type {
  AssetsService,
  TokenAccountWithMetadata,
} from '../assets/AssetsService';
import type { ConfigProvider } from '../config';
import type {
  AccountNotification,
  RpcAccountMonitor,
  RpcAccountMonitoringParams,
} from '../subscriptions';
import type { TransactionsService } from '../transactions/TransactionsService';
import type { AccountService } from './AccountService';

/**
 * Business logic for monitoring keyring accounts via WebSockets:
 *
 * It monitors the native asset (SOL) for the given account, and all the token assets for the given account.
 * Whenever one of these changes, it saves the new balance.
 */
export class KeyringAccountMonitor {
  readonly #rpcAccountMonitor: RpcAccountMonitor;

  readonly #accountService: AccountService;

  readonly #assetsService: AssetsService;

  readonly #transactionsService: TransactionsService;

  readonly #configProvider: ConfigProvider;

  readonly #logger: ILogger;

  readonly #loggerPrefix = '[🗝️ KeyringAccountMonitor]';

  constructor(
    rpcAccountMonitor: RpcAccountMonitor,
    accountService: AccountService,
    assetsService: AssetsService,
    transactionsService: TransactionsService,
    configProvider: ConfigProvider,
    eventEmitter: EventEmitter,
    logger: ILogger,
  ) {
    this.#rpcAccountMonitor = rpcAccountMonitor;
    this.#accountService = accountService;
    this.#assetsService = assetsService;
    this.#transactionsService = transactionsService;
    this.#configProvider = configProvider;
    this.#logger = logger;

    eventEmitter.on('onStart', this.#monitorAllKeyringAccounts.bind(this));
    eventEmitter.on('onUpdate', this.#monitorAllKeyringAccounts.bind(this));
    eventEmitter.on('onInstall', this.#monitorAllKeyringAccounts.bind(this));
  }

  async #monitorAllKeyringAccounts(): Promise<void> {
    this.#logger.log(this.#loggerPrefix, 'Monitoring all keyring accounts');

    const accounts = await this.#accountService.getAll();

    await Promise.allSettled(
      accounts.map(async (account) => {
        await this.monitorKeyringAccount(account);
      }),
    );
  }

  async monitorKeyringAccount(account: SolanaKeyringAccount): Promise<void> {
    this.#logger.log(this.#loggerPrefix, 'Monitoring keyring account', account);

    const { activeNetworks } = this.#configProvider.get();

    // Get token accounts
    const tokenAccounts =
      await this.#assetsService.getTokenAccountsByOwnerMultiple(
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

    // TODO: Monitor NFTs?

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

    await this.#rpcAccountMonitor.monitor({
      address,
      commitment: 'confirmed',
      network,
      onAccountChanged: async (
        notification: AccountNotification,
        params: RpcAccountMonitoringParams,
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
    params: RpcAccountMonitoringParams,
  ): Promise<void> {
    this.#logger.log(this.#loggerPrefix, 'Native asset balance changed', {
      account,
      notification,
      params,
    });

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

    const assetType: CaipAssetType = `${network}/${SolanaCaip19Tokens.SOL}`;

    await this.#assetsService.saveAsset(account, assetType, balance);
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

    await this.#rpcAccountMonitor.monitor({
      address,
      commitment: 'confirmed',
      network,
      onAccountChanged: async (
        notification: AccountNotification,
        params: RpcAccountMonitoringParams,
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
    params: RpcAccountMonitoringParams,
  ): Promise<void> {
    this.#logger.log(this.#loggerPrefix, 'Token asset changed', {
      account,
      notification,
      params,
    });

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

    await this.#assetsService.saveAsset(account, assetType, balance);
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

    const tokenAccounts =
      await this.#assetsService.getTokenAccountsByOwnerMultiple(
        asAddress(address),
        [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
        activeNetworks,
      );

    // Stop monitoring native assets across all activeNetworks networks
    const nativeAssetsPromises = activeNetworks.map(async (network) =>
      this.#rpcAccountMonitor.stopMonitoring(address, network),
    );

    // Stop monitoring token assets across all active networks
    const tokenAssetsPromises = tokenAccounts.map(async (tokenAccount) =>
      this.#rpcAccountMonitor.stopMonitoring(
        tokenAccount.pubkey,
        tokenAccount.scope,
      ),
    );

    await Promise.allSettled([...nativeAssetsPromises, ...tokenAssetsPromises]);
  }
}
