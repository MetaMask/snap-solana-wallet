/* eslint-disable jsdoc/check-indentation */
import { assert, string } from '@metamask/superstruct';
import type { CaipAssetType } from '@metamask/utils';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import type { Base58EncodedBytes } from '@solana/kit';
import { address as asAddress } from '@solana/kit';
import { get } from 'lodash';

import type {
  AccountNotification,
  ProgramNotification,
  SolanaKeyringAccount,
  Subscription,
} from '../../../entities';
import type { EventEmitter } from '../../../infrastructure';
import type { Network } from '../../constants/solana';
import { SolanaCaip19Tokens } from '../../constants/solana';
import { fromTokenUnits } from '../../utils/fromTokenUnit';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import type { AssetsService } from '../assets/AssetsService';
import type { ConfigProvider } from '../config';
import type { SubscriptionService } from '../subscriptions';
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
  readonly #subscriptionService: SubscriptionService;

  readonly #accountService: AccountService;

  readonly #assetsService: AssetsService;

  readonly #transactionsService: TransactionsService;

  readonly #configProvider: ConfigProvider;

  readonly #eventEmitter: EventEmitter;

  readonly #logger: ILogger;

  /**
   * A map that stores the monitored keyring accounts and their monitored networks.
   * {
   *   '4b445722-6766-4f99-ade5-c2c9295f21d0': new Set([
   *     Network.Mainnet,
   *     Network.Devnet,
   *   ]),
   *   '123e4567-e89b-12d3-a456-426614174001': new Set([
   *     Network.Mainnet,
   *   ]),
   * }
   */
  #monitoredKeyringAccounts: Map<string, Set<Network>> = new Map();

  readonly #tokenProgramsAddresses = [
    TOKEN_PROGRAM_ADDRESS,
    TOKEN_2022_PROGRAM_ADDRESS,
  ];

  constructor(
    subscriptionService: SubscriptionService,
    accountService: AccountService,
    assetsService: AssetsService,
    transactionsService: TransactionsService,
    configProvider: ConfigProvider,
    eventEmitter: EventEmitter,
    logger: ILogger,
  ) {
    this.#subscriptionService = subscriptionService;
    this.#accountService = accountService;
    this.#assetsService = assetsService;
    this.#transactionsService = transactionsService;
    this.#configProvider = configProvider;
    this.#eventEmitter = eventEmitter;
    this.#logger = createPrefixedLogger(logger, '[🗝️ KeyringAccountMonitor]');

    this.#bindHandlers();
  }

  #bindHandlers(): void {
    this.#logger.info('Binding handlers');

    // When the extension starts, or that the snap is updated / installed, the Snap platform has lost all its previously opened websockets, so we need to re-initialize
    // this.#eventEmitter.on('onStart', this.#handleOnStart.bind(this));
    // this.#eventEmitter.on('onUpdate', this.#handleOnStart.bind(this));
    // this.#eventEmitter.on('onInstall', this.#handleOnStart.bind(this));

    const { activeNetworks } = this.#configProvider.get();

    // Register callbacks that will handle account and program notifications.
    activeNetworks.forEach((network) => {
      this.#subscriptionService.registerNotificationHandler(
        'accountSubscribe',
        network,
        this.#handleAccountNotification.bind(this),
      );
      this.#subscriptionService.registerNotificationHandler(
        'programSubscribe',
        network,
        this.#handleProgramNotification.bind(this),
      );
    });

    // Register the connection recovery callback that will handle missed messages.
    activeNetworks.forEach((network) => {
      this.#subscriptionService.registerConnectionRecoveryHandler(
        network,
        this.#handleConnectionRecovery.bind(this),
      );
    });
  }

  async #handleOnStart(): Promise<void> {
    this.#logger.info('Handling onStart/onUpdate/onInstall');

    const accounts = await this.#accountService.getAll();

    // Ensure a clean start by stopping monitoring all accounts
    const monitoredAccountIds = Array.from(
      this.#monitoredKeyringAccounts.keys(),
    );
    await Promise.allSettled(
      monitoredAccountIds.map(async (accountId) => {
        const account = accounts.find((item) => item.id === accountId);
        if (account) {
          await this.stopMonitorKeyringAccount(account);
        }
      }),
    );

    // Monitor all accounts
    await Promise.allSettled(
      accounts.map(async (account) => {
        await this.monitorKeyringAccount(account);
      }),
    );
  }

  async monitorKeyringAccount(account: SolanaKeyringAccount): Promise<void> {
    this.#logger.log('Monitoring keyring account', account);

    const { address, id } = account;
    const { activeNetworks } = this.#configProvider.get();

    const isNotMonitoredOnNetwork = (network: Network) =>
      !this.#monitoredKeyringAccounts.get(id)?.has(network);

    // Monitor native assets
    const nativeAssetsPromises = activeNetworks
      .filter(isNotMonitoredOnNetwork)
      .map(async (network) =>
        this.#monitorAccountNativeAsset(account, network),
      );

    // Monitor token assets
    const tokenProgramPromises = activeNetworks
      .filter(isNotMonitoredOnNetwork)
      .map(async (network) => {
        await Promise.all(
          this.#tokenProgramsAddresses.map(async (tokenProgramAddress) =>
            this.#monitorProgramByOwner(tokenProgramAddress, address, network),
          ),
        );
      });

    await Promise.allSettled([
      ...tokenProgramPromises,
      ...nativeAssetsPromises,
    ]);
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
    this.#logger.log('Monitoring native asset balance', {
      account,
      network,
    });

    const { address, id: accountId } = account;

    const subscriptions = await this.#subscriptionService.getAll();
    const isMonitoredOnNetwork = subscriptions.some(
      (subscription) =>
        subscription.method === 'accountSubscribe' &&
        get(subscription, 'params[0]') === address &&
        subscription.network === network,
    );
    if (isMonitoredOnNetwork) {
      return;
    }

    if (!account.scopes.includes(network)) {
      this.#logger.log('Account does not have scope for network', {
        account,
        network,
      });
      return;
    }

    await this.#subscriptionService.subscribe({
      method: 'accountSubscribe',
      network,
      params: [address, { commitment: 'confirmed', encoding: 'jsonParsed' }],
    });

    // Add the native account address to the monitored set
    this.#saveMonitoredAccountOnNetwork(accountId, network);
  }

  async #monitorProgramByOwner(
    tokenProgramAddress: string,
    ownerAddress: string,
    network: Network,
  ): Promise<void> {
    this.#logger.log('Monitoring token program by owner', {
      tokenProgramAddress,
      ownerAddress,
    });

    const subscriptions = await this.#subscriptionService.getAll();
    const isMonitoredOnNetwork = subscriptions.some(
      (subscription) =>
        subscription.method === 'programSubscribe' &&
        get(subscription, 'params[0]') === tokenProgramAddress &&
        get(subscription, 'params[1].filters[0].memcmp.bytes') ===
          ownerAddress &&
        subscription.network === network,
    );
    if (isMonitoredOnNetwork) {
      return;
    }

    await this.#subscriptionService.subscribe({
      method: 'programSubscribe',
      network,
      params: [
        tokenProgramAddress,
        {
          commitment: 'confirmed',
          encoding: 'jsonParsed',
          filters: [
            {
              memcmp: {
                offset: 32, // Offset of 'owner' in token account layout
                bytes: ownerAddress as Base58EncodedBytes,
                encoding: 'base58',
              },
            },
          ],
        } as any,
      ],
    });
  }

  async #handleAccountNotification(
    notification: AccountNotification,
    subscription: Subscription,
  ): Promise<void> {
    this.#logger.info('Account notification received', {
      notification,
      subscription,
    });
    const { network } = subscription;

    const address = get(subscription, 'params[0]');
    assert(address, string());

    // This notification could be for any RPC account.
    // Here, we only handle "actual" accounts, not token accounts.
    const keyringAccount = await this.#accountService.findByAddress(address);
    if (!keyringAccount) {
      this.#logger.info('No keyring account found for address', address);
      return;
    }

    // Handle the notification with clean data
    const lamports = notification.params.result.value?.lamports;
    if (!lamports) {
      throw new Error('No balance found in account changed event');
    }

    const assetType: CaipAssetType = `${network}/${SolanaCaip19Tokens.SOL}`;
    const balance = {
      amount: fromTokenUnits(lamports, 9),
      unit: 'SOL',
    };

    await Promise.all([
      this.#assetsService.saveAsset(keyringAccount, assetType, balance),
      this.#saveCausingTransaction(keyringAccount, network, address),
    ]);
  }

  async #handleProgramNotification(
    notification: ProgramNotification,
    subscription: Subscription,
  ): Promise<void> {
    this.#logger.info('Handling program notification', {
      notification,
      subscription,
    });

    const { network } = subscription;

    const programAddress = get(subscription, 'params[0]');
    assert(programAddress, string());

    if (
      programAddress !== TOKEN_PROGRAM_ADDRESS &&
      programAddress !== TOKEN_2022_PROGRAM_ADDRESS
    ) {
      this.#logger.warn('Program not supported', programAddress);
      return;
    }

    const owner = get(
      notification,
      'params.result.value.account.data.parsed.info.owner',
    );
    assert(owner, string());

    const mint = get(
      notification,
      'params.result.value.account.data.parsed.info.mint',
    );
    assert(mint, string());

    const uiAmountString = get(
      notification,
      'params.result.value.account.data.parsed.info.tokenAmount.uiAmountString',
    );
    assert(uiAmountString, string());

    const pubkey = get(notification, 'params.result.value.pubkey');
    assert(pubkey, string());

    const assetType = tokenAddressToCaip19(network, mint);

    const keyringAccount = await this.#accountService.findByAddress(owner);
    if (!keyringAccount) {
      throw new Error('No keyring account found with address', owner);
    }

    await Promise.all([
      // Update the balance of the token asset
      this.#assetsService
        .saveAsset(keyringAccount, assetType, {
          amount: uiAmountString,
          unit: '',
        })
        .catch((error) => {
          this.#logger.error('Error updating token asset balance', error);
        }),
      // Fetch and save the transaction that caused the token asset change.
      this.#saveCausingTransaction(keyringAccount, network, pubkey).catch(
        (error) => {
          this.#logger.error('Error saving causing transaction', error);
        },
      ),
    ]);
  }

  /**
   * Fetch the transaction that caused the RPC account (native asset or token asset) to change and save it.
   * This is to cover the case where the balance changed due to a "receive" (transfer from another account outside of the extension).
   *
   * @param account - The keyring account that the RPC account changed for.
   * @param network - The network of the RPC account.
   * @param address - The address of the RPC account.
   */
  async #saveCausingTransaction(
    account: SolanaKeyringAccount,
    network: Network,
    address: string,
  ): Promise<void> {
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
    this.#logger.log('Stopping to monitor all assets of account', account);

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

    // // Stop monitoring native assets across all activeNetworks networks
    // const nativeAssetsPromises = activeNetworks.map(async (network) =>
    //   this.#rpcAccountMonitor.stopMonitoring(address, network),
    // );

    // Stop monitoring token assets across all active networks
    // const tokenAssetsPromises = tokenAccounts.map(async (tokenAccount) =>
    //   this.#rpcAccountMonitor.stopMonitoring(
    //     tokenAccount.pubkey,
    //     tokenAccount.scope,
    //   ),
    // );

    // await Promise.allSettled([...nativeAssetsPromises, ...tokenAssetsPromises]);
  }

  /**
   * Register in the local state that the account is being monitored on the given network.
   * @param accountId - The id of the account to save.
   * @param network - The network to save.
   */
  #saveMonitoredAccountOnNetwork(accountId: string, network: Network) {
    if (!this.#monitoredKeyringAccounts.has(accountId)) {
      this.#monitoredKeyringAccounts.set(accountId, new Set());
    }

    if (!this.#monitoredKeyringAccounts.get(accountId)?.has(network)) {
      this.#monitoredKeyringAccounts.get(accountId)?.add(network);
    }
  }

  async #handleConnectionRecovery(network: Network): Promise<void> {
    this.#logger.info('Handling connection recovery', { network });

    const accounts = await this.#accountService.getAll();

    const subscriptions = await this.#subscriptionService.getAll();
    const accountSubscriptions = subscriptions.filter(
      (subscription) =>
        subscription.network === network &&
        subscription.method === 'accountSubscribe',
    );

    const accountPreviouslyMonitoredOnThisNetwork = accounts.filter((account) =>
      accountSubscriptions.some(
        (subscription) => get(subscription, 'params[0]') === account.address,
      ),
    );

    if (!accountPreviouslyMonitoredOnThisNetwork.length) {
      return;
    }

    // Recover from potential missed messages by refreshing the assets of the accounts that were previously monitored on this network
    await this.#assetsService.refreshAssets(
      accountPreviouslyMonitoredOnThisNetwork,
    );
  }
}
