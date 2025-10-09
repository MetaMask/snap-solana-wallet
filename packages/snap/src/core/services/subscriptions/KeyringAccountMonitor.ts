/* eslint-disable jsdoc/check-indentation */
import { assert, number, string } from '@metamask/superstruct';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import type { Base58EncodedBytes } from '@solana/kit';
import { address as asAddress, lamports } from '@solana/kit';
import { get, uniq } from 'lodash';

import type { SubscriptionService } from '.';
import type {
  AccountNotification,
  ProgramNotification,
  SolanaKeyringAccount,
  Subscription,
} from '../../../entities';
import type { Network } from '../../constants/solana';
import { SolanaCaip19Tokens } from '../../constants/solana';
import { fromTokenUnits } from '../../utils/fromTokenUnit';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import type { AccountsSynchronizer } from '../accounts';
import type { AccountsService } from '../accounts/AccountsService';
import type { AssetsService, TokenHelper } from '../assets';
import type { ConfigProvider } from '../config';
import { SUPPORTED_NETWORKS } from '../config/ConfigProvider';
import type { TransactionsService } from '../transactions';
import { isSpam } from '../transactions/utils/isSpam';

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

  readonly #accountService: AccountsService;

  readonly #assetsService: AssetsService;

  readonly #transactionsService: TransactionsService;

  readonly #accountsSynchronizer: AccountsSynchronizer;

  readonly #tokenHelper: TokenHelper;

  readonly #configProvider: ConfigProvider;

  readonly #logger: ILogger;

  readonly #tokenProgramsAddresses = [
    TOKEN_PROGRAM_ADDRESS,
    TOKEN_2022_PROGRAM_ADDRESS,
  ];

  constructor(
    subscriptionService: SubscriptionService,
    accountService: AccountsService,
    assetsService: AssetsService,
    transactionsService: TransactionsService,
    accountsSynchronizer: AccountsSynchronizer,
    tokenHelper: TokenHelper,
    configProvider: ConfigProvider,
    logger: ILogger,
  ) {
    this.#subscriptionService = subscriptionService;
    this.#accountService = accountService;
    this.#assetsService = assetsService;
    this.#transactionsService = transactionsService;
    this.#accountsSynchronizer = accountsSynchronizer;
    this.#tokenHelper = tokenHelper;
    this.#configProvider = configProvider;
    this.#logger = createPrefixedLogger(logger, '[🗝️ KeyringAccountMonitor]');

    this.#bindHandlers();
  }

  #bindHandlers(): void {
    this.#logger.info('Binding handlers');

    // Register callbacks that will handle account and program notifications.
    SUPPORTED_NETWORKS.forEach((network) => {
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
    SUPPORTED_NETWORKS.forEach((network) => {
      this.#subscriptionService.registerConnectionRecoveryHandler(
        network,
        this.#handleConnectionRecovery.bind(this),
      );
    });
  }

  /**
   * Sets the monitored accounts. It will:
   * - stop monitoring accounts currently monitored that are not in the list.
   * - and start monitoring accounts that are in the list that are not currently monitored.
   * @param accountIds - The ids of the accounts to set as monitored.
   */
  async setMonitoredAccounts(accountIds: string[]): Promise<void> {
    this.#logger.info('Setting monitored accounts', accountIds);

    const [allAccounts, allSubscriptions, activeNetworks] = await Promise.all([
      this.#accountService.getAll(),
      this.#subscriptionService.getAll(),
      this.#configProvider.getActiveNetworks(),
    ]);

    const currentlyMonitoredAccounts = allAccounts.filter((account) =>
      allSubscriptions.some(
        (subscription) =>
          account.address === get(subscription, 'params[0]') ||
          account.address ===
            get(subscription, 'params[1].filters[0].memcmp.bytes'),
      ),
    );

    // Stop monitoring the currently monitored accounts...
    const accountsToStopMonitoring = currentlyMonitoredAccounts
      // ...that are not in the passed list
      .filter((account) => !accountIds.includes(account.id));

    // Start monitoring accounts...
    const accountsToStartMonitoring = allAccounts
      // ...from the passed list
      .filter((account) => accountIds.includes(account.id))
      // ...that are not currently monitored
      .filter((account) => !currentlyMonitoredAccounts.includes(account));

    await Promise.allSettled([
      this.#stopMonitorKeyringAccounts(
        accountsToStopMonitoring,
        allSubscriptions,
      ),
      this.#startMonitorKeyringAccounts(
        accountsToStartMonitoring,
        activeNetworks,
      ),
    ]);
  }

  /**
   * Batch monitors the native and token assets for a single account across all active networks.
   * @param accounts - The accounts to monitor the assets for.
   * @param networks - The networks to monitor the assets for.
   */
  async #startMonitorKeyringAccounts(
    accounts: SolanaKeyringAccount[],
    networks: Network[],
  ): Promise<void> {
    try {
      this.#logger.log('Monitoring keyring accounts', accounts);

      // Perform a full sync of the accounts
      const synchronizePromise =
        this.#accountsSynchronizer.synchronize(accounts);

      const promises = accounts.flatMap((account) => {
        const shouldMonitorOnNetwork = (network: Network) =>
          account.scopes.includes(network);

        // Monitor native assets
        const nativeAssetsPromises = networks
          .filter(shouldMonitorOnNetwork)
          .map(async (network) =>
            this.#monitorAccountNativeAsset(account, network),
          );

        // Monitor token assets
        const tokenProgramPromises = networks
          .filter(shouldMonitorOnNetwork)
          .map(async (network) => {
            await Promise.all(
              this.#tokenProgramsAddresses.map(async (tokenProgramAddress) =>
                this.#monitorProgramByOwner(
                  account,
                  tokenProgramAddress,
                  network,
                ),
              ),
            );
          });

        return [...nativeAssetsPromises, ...tokenProgramPromises];
      });

      await Promise.allSettled([...promises, synchronizePromise]);
    } catch (error) {
      this.#logger.error('Error monitoring keyring account', error);
      throw error;
    }
  }

  /**
   * Batch stops monitoring the passed accounts.
   * @param accounts - The accounts to stop monitoring.
   * @param subscriptions - The subscriptions to stop monitoring.
   */
  async #stopMonitorKeyringAccounts(
    accounts: SolanaKeyringAccount[],
    subscriptions: Subscription[],
  ): Promise<void> {
    this.#logger.log('Stopping to monitor accounts', accounts);

    const addresses = accounts.map((account) => account.address);

    const subscriptionsToUnsubscribe = subscriptions
      // Only keep the "accountSubscribe" and "programSubscribe" subscriptions
      .filter(
        (subscription) =>
          KeyringAccountMonitor.#isAccountSubscribeSubscription(subscription) ||
          KeyringAccountMonitor.#isProgramSubscribeSubscription(subscription),
      )
      // Only keep the subscriptions for the passed accounts
      .filter((subscription) =>
        addresses.includes(KeyringAccountMonitor.#extractAddress(subscription)),
      );

    // Unsubscribe from them all
    await Promise.allSettled(
      subscriptionsToUnsubscribe.map(async (subscription) =>
        this.#subscriptionService.unsubscribe(subscription.id),
      ),
    );
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

    const { address } = account;

    await this.#subscriptionService.subscribe({
      method: 'accountSubscribe',
      network,
      params: [address, { commitment: 'confirmed', encoding: 'jsonParsed' }],
    });
  }

  async #monitorProgramByOwner(
    account: SolanaKeyringAccount,
    tokenProgramAddress: string,
    network: Network,
  ): Promise<void> {
    this.#logger.log('Monitoring token program by owner', {
      account,
      tokenProgramAddress,
      network,
    });

    const { address } = account;

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
                bytes: address as Base58EncodedBytes,
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
      throw new Error(`No keyring account found for address: ${address}`);
    }

    // Handle the notification with clean data
    const { lamports: accountLamports } = notification.params.result.value;
    assert(accountLamports, number());

    const decimals = 9;

    await Promise.all([
      this.#assetsService.save({
        assetType: `${network}/${SolanaCaip19Tokens.SOL}`,
        keyringAccountId: keyringAccount.id,
        network,
        address,
        symbol: 'SOL',
        decimals,
        rawAmount: accountLamports.toString(),
        uiAmount: fromTokenUnits(accountLamports, decimals),
      }),
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
      throw new Error(`Program not supported: ${programAddress}`);
    }

    const { owner } = notification.params.result.value.account.data.parsed.info;
    assert(owner, string());

    const { mint } = notification.params.result.value.account.data.parsed.info;
    assert(mint, string());

    const { amount, decimals, uiAmountString } =
      notification.params.result.value.account.data.parsed.info.tokenAmount;
    assert(amount, string());
    assert(decimals, number());
    assert(uiAmountString, string());

    const { pubkey } = notification.params.result.value;
    assert(pubkey, string());

    const assetType = tokenAddressToCaip19(network, mint);

    const keyringAccount = await this.#accountService.findByAddress(owner);
    if (!keyringAccount) {
      throw new Error(`No keyring account found with address: ${owner}`);
    }

    /**
     * WARNING: This is to compensate for the fact that the notification returned by Infura's programSubscribe
     * includes a uiAmount/uiAmountString that does not take into account the mint's multiplier (if any).
     * In theory, it should; because the regular Solana RPC (wss://api.mainnet-beta.solana.com) does.
     *
     * So this needs to be removed once Infura fixes their programSubscribe notification.
     */
    const uiAmount = await this.#tokenHelper
      .amountToUiAmountForMint(mint, network, lamports(BigInt(amount)))
      .catch((error) => {
        this.#logger.error('Error converting amount to uiAmount', error);
        return uiAmountString;
      });

    const metadata = (await this.#assetsService.getAssetsMetadata([assetType]))[
      assetType
    ];

    await Promise.all([
      // Update the balance of the token asset
      this.#assetsService.save({
        assetType,
        keyringAccountId: keyringAccount.id,
        network,
        mint,
        pubkey,
        symbol: metadata?.symbol ?? 'UNKNOWN',
        decimals,
        rawAmount: amount,
        uiAmount,
      }),
      // Fetch and save the transaction that caused the token asset change.
      this.#saveCausingTransaction(keyringAccount, network, pubkey),
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
        {
          limit: 1,
        },
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

    // Ignore spam transactions
    if (isSpam(transaction, account)) {
      this.#logger.info(`Transaction ${signature} is spam. Skipping.`);
      return;
    }

    // Note that the TransactionService will avoid saving duplicates in the state.
    await this.#transactionsService.save(transaction);
  }

  /**
   * Recover from potential missed messages (while connection was down)
   * by syncing all monitored accounts.
   *
   * @param network - The network to handle the connection recovery for.
   */
  async #handleConnectionRecovery(network: Network): Promise<void> {
    this.#logger.info('Handling connection recovery', { network });

    const [allAccounts, allSubscriptions] = await Promise.all([
      this.#accountService.getAll(),
      this.#subscriptionService.getAll(),
    ]);

    // Find all 'accountSubscribe' and 'programSubscribe' subscriptions
    const relevantSubscriptions = allSubscriptions.filter(
      (subscription) =>
        KeyringAccountMonitor.#isAccountSubscribeSubscription(subscription) ||
        KeyringAccountMonitor.#isProgramSubscribeSubscription(subscription),
    );

    // Map the addresses
    const monitoredAccountsAddresses = uniq(
      relevantSubscriptions.map((subscription) =>
        KeyringAccountMonitor.#extractAddress(subscription),
      ),
    );

    // Find the matching accounts
    const monitoredAccounts = allAccounts.filter((account) =>
      monitoredAccountsAddresses.includes(account.address),
    );

    if (!monitoredAccounts.length) {
      this.#logger.info(
        'No monitored accounts found. Skipping connection recovery.',
      );
      return;
    }

    await this.#accountsSynchronizer.synchronize(monitoredAccounts);
  }

  static #isAccountSubscribeSubscription(subscription: Subscription): boolean {
    return subscription.method === 'accountSubscribe';
  }

  static #isProgramSubscribeSubscription(subscription: Subscription): boolean {
    return subscription.method === 'programSubscribe';
  }

  static #extractAddress(subscription: Subscription): string {
    if (this.#isAccountSubscribeSubscription(subscription)) {
      return get(subscription, 'params[0]') as string;
    }
    if (this.#isProgramSubscribeSubscription(subscription)) {
      return get(subscription, 'params[1].filters[0].memcmp.bytes') as string;
    }
    throw new Error('Invalid subscription');
  }
}
