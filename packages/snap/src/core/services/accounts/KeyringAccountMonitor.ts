/* eslint-disable jsdoc/check-indentation */
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
 * - It gets updates when the balance of the native asset (SOL) changes by subscribing to the RPC account.
 * - It gets updates when the balance of token assets change by subscribing to each RPC token account.
 *
 * On each update:
 * - It saves the new balance. Under the hood, AssetsService also notifies the extension.
 * - It fetches the transaction that caused the native asset or token asset to change and saves it. Under the hood, TransactionsService also notifies the extension.
 */
export class KeyringAccountMonitor {
  readonly #rpcAccountMonitor: RpcAccountMonitor;

  readonly #accountService: AccountService;

  readonly #assetsService: AssetsService;

  readonly #transactionsService: TransactionsService;

  readonly #configProvider: ConfigProvider;

  readonly #logger: ILogger;

  readonly #loggerPrefix = '[🗝️ KeyringAccountMonitor]';

  /**
   * A map that stores the monitored keyring accounts and their monitored native asset and token accounts.
   *
   * Maps account id > network > monitored addresses.
   *
   * {
   *   '4b445722-6766-4f99-ade5-c2c9295f21d0': new Map([
   *     ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', new Set([
   *       'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP', // Native asset (account address)
   *       '9wt9PfjPD3JCy5r7o4K1cTGiuTG7fq2pQhdDCdQALKjg', // USDC token account for this user on mainnet
   *       'DJGpJufSnVDriDczovhcQRyxamKtt87PHQ7TJEcVB6ta', // ai16z token account for this user on mainnet
   *     ])],
   *     ['solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1', new Set([
   *       'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP', // Native asset (account address)
   *       'GiKryKnGJxdFacNXx7nHBvWdF3oZb6N6SQerKpfkdgUE', // EURC token account for this user on devnet
   *       '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC token account for this user on devnet
   *     ])],
   *   ]),
   *   '4b445722-6766-4f99-ade5-c2c9295f21d0': new Map([
   *     ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', new Set([
   *       'FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo', // Native asset (account address)
   *     ])],
   *     ['solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1', new Set([
   *       'FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo', // Native asset (account address)
   *     ])],
   *   ]),
   * }
   */
  #monitoredKeyringAccounts: Map<string, Map<Network, Set<string>>> = new Map();

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

    console.log(
      '🐦‍🔥🐦‍🔥🐦‍🔥🐦‍🔥🐦‍🔥🐦‍🔥this.#monitoredAccounts',
      this.#monitoredKeyringAccounts,
    );

    const accounts = await this.#accountService.getAll();

    await Promise.allSettled(
      accounts.map(async (account) => {
        await this.monitorKeyringAccount(account);
      }),
    );
  }

  async monitorKeyringAccount(account: SolanaKeyringAccount): Promise<void> {
    this.#logger.log(this.#loggerPrefix, 'Monitoring keyring account', account);

    const { address } = account;
    const { activeNetworks } = this.#configProvider.get();

    // Get token accounts
    const tokenAccounts = await this.#assetsService
      .getTokenAccountsByOwnerMultiple(
        asAddress(address),
        [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
        activeNetworks,
      )
      .catch((error) => {
        this.#logger.error(this.#loggerPrefix, 'Error getting token accounts', {
          account,
          error,
        });
        return [];
      });

    // Monitor native assets on this network
    const nativeAssetsPromises = activeNetworks.map(async (network) =>
      this.#monitorAccountNativeAsset(account, network),
    );

    // Monitor token assets on this network
    const tokenAssetsPromises = tokenAccounts.map(async (tokenAccount) =>
      this.#monitorAccountTokenAsset(account, tokenAccount),
    );

    await Promise.allSettled([...tokenAssetsPromises, ...nativeAssetsPromises]);
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

    const { address, id: accountId } = account;

    if (!account.scopes.includes(network)) {
      this.#logger.log(
        this.#loggerPrefix,
        'Account does not have scope for network',
        {
          account,
          network,
        },
      );
      return;
    }

    if (
      this.#monitoredKeyringAccounts.get(accountId)?.get(network)?.has(address)
    ) {
      this.#logger.log(this.#loggerPrefix, 'Native asset already monitored', {
        account,
        network,
      });
      return;
    }

    await this.#rpcAccountMonitor.monitor({
      address,
      commitment: 'confirmed',
      network,
      onAccountChanged: async (
        notification: AccountNotification,
        params: RpcAccountMonitoringParams,
      ) => await this.#handleNativeAssetChanged(account, notification, params),
    });

    // Add the native account address to the monitored set
    this.#saveMonitoredAddress(accountId, network, address);
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
    this.#logger.log(this.#loggerPrefix, 'Native asset changed', {
      account,
      notification,
      params,
    });

    await Promise.allSettled([
      // Update the balance of the native asset
      this.#updateNativeAssetBalance(account, notification, params),
      // Fetch and save the transaction that caused the native asset change.
      this.#saveCausingTransaction(account, params),
    ]);
  }

  async #updateNativeAssetBalance(
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
      throw new Error('No balance found in account changed event');
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

    const { pubkey: tokenAddress, scope: network } = tokenAccount;
    const { id: accountId } = account;

    if (
      this.#monitoredKeyringAccounts
        .get(accountId)
        ?.get(network)
        ?.has(tokenAddress)
    ) {
      this.#logger.log(this.#loggerPrefix, 'Token asset already monitored', {
        account,
        tokenAccount,
      });
      return;
    }

    await this.#rpcAccountMonitor.monitor({
      address: tokenAddress,
      commitment: 'confirmed',
      network,
      onAccountChanged: async (
        notification: AccountNotification,
        params: RpcAccountMonitoringParams,
      ) => await this.#handleTokenAssetChanged(account, notification, params),
    });

    // Add the token account address to the monitored set
    this.#saveMonitoredAddress(accountId, network, tokenAddress);
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

    await Promise.allSettled([
      // Update the balance of the token asset
      this.#updateTokenAssetBalance(account, notification, params),
      // Fetch and save the transaction that caused the token asset change.
      this.#saveCausingTransaction(account, params),
    ]);
  }

  async #updateTokenAssetBalance(
    account: SolanaKeyringAccount,
    notification: AccountNotification,
    params: RpcAccountMonitoringParams,
  ): Promise<void> {
    const { network } = params;

    const mint = get(notification, 'value.data.parsed.info.mint');
    if (!mint) {
      throw new Error('No mint found in token account changed event');
    }

    const uiAmountString = get(
      notification,
      'value.data.parsed.info.tokenAmount.uiAmountString',
    );
    if (!uiAmountString) {
      throw new Error('No uiAmountString found in token account changed event');
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
   * Fetch the transaction that caused the RPC account (native asset or token asset) to change and save it.
   * This is to cover the case where the balance changed due to a "receive" (transfer from another account outside of the extension).
   *
   * @param account - The keyring account that the RPC account changed for.
   * @param params - The parameters for the event.
   */
  async #saveCausingTransaction(
    account: SolanaKeyringAccount,
    params: RpcAccountMonitoringParams,
  ): Promise<void> {
    const { network, address } = params;

    const signature = (
      await this.#transactionsService.fetchLatestSignatures(
        network,
        asAddress(address),
        1,
      )
    )?.[0];

    if (!signature) {
      throw new Error('No signature found');
    }

    const transaction = await this.#transactionsService.fetchBySignature(
      signature,
      account,
      network,
    );

    if (!transaction) {
      throw new Error('No transaction found');
    }

    // Note that the TransactionService will avoid saving duplicates in the state.
    await this.#transactionsService.saveTransaction(transaction, account);
  }

  /**
   * Stops monitoring all assets for a single account across all active networks.
   * @param account - The account to monitor the assets for.
   */
  async stopMonitorKeyringAccount(
    account: SolanaKeyringAccount,
  ): Promise<void> {
    this.#logger.log(
      this.#loggerPrefix,
      'Stopping to monitor all assets of account',
      account,
    );

    const { address, id } = account;
    const { activeNetworks } = this.#configProvider.get();

    const tokenAccounts =
      await this.#assetsService.getTokenAccountsByOwnerMultiple(
        asAddress(address),
        [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
        activeNetworks,
      );

    // Clean up the monitored accounts map
    this.#monitoredKeyringAccounts.delete(id);

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

  #saveMonitoredAddress(accountId: string, network: Network, address: string) {
    if (!this.#monitoredKeyringAccounts.has(accountId)) {
      this.#monitoredKeyringAccounts.set(accountId, new Map());
    }

    if (!this.#monitoredKeyringAccounts.get(accountId)?.has(network)) {
      this.#monitoredKeyringAccounts.get(accountId)?.set(network, new Set());
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.#monitoredKeyringAccounts.get(accountId)!.get(network)!.add(address);
  }
}
