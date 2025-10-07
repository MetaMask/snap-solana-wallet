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
   * Monitors the native and token assets for a single account across all active networks.
   * @param account - The account to monitor the assets for.
   */
  async monitorKeyringAccount(account: SolanaKeyringAccount): Promise<void> {
    try {
      this.#logger.log('Monitoring keyring account', account);

      const activeNetworks = await this.#configProvider.getActiveNetworks();

      // Skip if the account is already monitored
      const monitoredAccounts = await this.#getMonitoredAccounts();
      const isMonitored = monitoredAccounts.some(
        (monitoredAccount) => monitoredAccount.address === account.address,
      );
      if (isMonitored) {
        this.#logger.info('Account is already monitored', account);
        return;
      }

      // Perform a full sync of the account
      const synchronizePromise = this.#accountsSynchronizer.synchronize([
        account,
      ]);

      const shouldMonitorOnNetwork = (network: Network) =>
        account.scopes.includes(network);

      // Monitor native assets
      const nativeAssetsPromises = activeNetworks
        .filter(shouldMonitorOnNetwork)
        .map(async (network) =>
          this.#monitorAccountNativeAsset(account, network),
        );

      // Monitor token assets
      const tokenProgramPromises = activeNetworks
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

      await Promise.allSettled([
        ...tokenProgramPromises,
        ...nativeAssetsPromises,
        synchronizePromise,
      ]);
    } catch (error) {
      this.#logger.error('Error monitoring keyring account', error);
      await this.stopMonitorKeyringAccount(account);
      throw error;
    }
  }

  /**
   * Stops monitoring all assets for a single account across all active networks.
   * @param account - The account to monitor the assets for.
   */
  async stopMonitorKeyringAccount(
    account: SolanaKeyringAccount,
  ): Promise<void> {
    this.#logger.log('Stopping to monitor all assets of account', account);

    const { address } = account;

    const allSubscriptions = await this.#subscriptionService.getAll();

    // Find all 'accountSubscribe' and 'programSubscribe' subscriptions for this account
    const accountSubscribeSubscriptions = allSubscriptions.filter(
      (subscription) =>
        subscription.method === 'accountSubscribe' &&
        get(subscription, 'params[0]') === address,
    );

    const programSubscribeSubscriptions = allSubscriptions.filter(
      (subscription) =>
        subscription.method === 'programSubscribe' &&
        get(subscription, 'params[1].filters[0].memcmp.bytes') === address,
    );

    const subscriptionsToUnsubscribe = [
      ...accountSubscribeSubscriptions,
      ...programSubscribeSubscriptions,
    ];

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

    const monitoredAccounts = await this.#getMonitoredAccounts();

    if (!monitoredAccounts.length) {
      this.#logger.info(
        'No monitored accounts found. Skipping connection recovery.',
      );
      return;
    }

    await this.#accountsSynchronizer.synchronize(monitoredAccounts);
  }

  /**
   * Get the accounts that are currently being monitored.
   * @returns The accounts that are currently being monitored.
   */
  async #getMonitoredAccounts(): Promise<SolanaKeyringAccount[]> {
    const subscriptions = await this.#subscriptionService.getAll();

    // Get the 'accountSubscribe' subscriptions
    const accountSubscribeSubscriptions = subscriptions.filter(
      (subscription) => subscription.method === 'accountSubscribe',
    );
    // Map the account addresses
    const accountSubscribeAddresses = accountSubscribeSubscriptions.map(
      (subscription) => get(subscription, 'params[0]'),
    );

    // Get the 'programSubscribe' subscriptions
    const programSubscribeSubscriptions = subscriptions.filter(
      (subscription) => subscription.method === 'programSubscribe',
    );
    // Map the program addresses
    const programSubscribeAddresses = programSubscribeSubscriptions.map(
      (subscription) => get(subscription, 'params[1].filters[0].memcmp.bytes'),
    );

    // Merge addresses and dedupe
    const monitoredAccountAddresses = uniq([
      ...accountSubscribeAddresses,
      ...programSubscribeAddresses,
    ]);

    if (!monitoredAccountAddresses.length) {
      return [];
    }

    // Map the complete accounts
    const monitoredAccounts = await this.#accountService.getAll();
    return monitoredAccounts.filter((account) =>
      monitoredAccountAddresses.includes(account.address),
    );
  }
}
