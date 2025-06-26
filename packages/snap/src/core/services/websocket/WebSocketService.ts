import type { Address, Signature } from '@solana/kit';

import type { SolanaKeyringAccount } from '../../../entities';
import { Network } from '../../constants/solana';
import type { JsonRpcSubscription, SubscriptionManagerPort } from '../../ports';
import type { ILogger } from '../../utils/logger';
import type { AssetsService } from '../assets/AssetsService';
import type { State } from '../state/State';
import type { TransactionsService } from '../transactions/TransactionsService';

export type SubscriptionInfo = {
  subscriptionId: string;
  address: string;
  type: 'account' | 'signature';
  network: Network;
  createdAt: number;
};

// export type WebSocketMethod =
//   | 'accountSubscribe'
//   | 'accountUnsubscribe'
//   | 'blockSubscribe'
//   | 'blockUnsubscribe'
//   | 'logsSubscribe'
//   | 'logsUnsubscribe'
//   | 'programSubscribe'
//   | 'programUnsubscribe'
//   | 'rootSubscribe'
//   | 'rootUnsubscribe'
//   | 'signatureSubscribe'
//   | 'signatureUnsubscribe'
//   | 'slotSubscribe'
//   | 'slotUpdatesSubscribe'
//   | 'slotUpdatesUnsubscribe'
//   | 'slotUnsubscribe'
//   | 'voteSubscribe'
//   | 'voteUnsubscribe';

/**
 * Service that manages WebSocket subscriptions and handles real-time updates
 * for accounts and transactions, replacing the HTTP polling mechanism.
 */
export class WebSocketService {
  readonly #subscriptionManager: SubscriptionManagerPort;

  readonly #assetsService: AssetsService;

  readonly #transactionsService: TransactionsService;

  readonly #stateService: State<any>;

  readonly #logger: ILogger;

  readonly #activeSubscriptions: Map<string, SubscriptionInfo> = new Map();

  readonly #accountSubscriptions: Map<string, string> = new Map(); // address -> subscription ID

  readonly #signatureSubscriptions: Map<string, string> = new Map(); // signature -> subscription ID

  readonly #signatureTimeouts: Map<string, NodeJS.Timeout> = new Map();

  readonly #signatureTimeoutMs = 5 * 60 * 1000; // 5 minutes timeout

  constructor(
    subscriptionManager: SubscriptionManagerPort,
    assetsService: AssetsService,
    transactionsService: TransactionsService,
    stateService: State<any>,
    logger: ILogger,
  ) {
    this.#subscriptionManager = subscriptionManager;
    this.#assetsService = assetsService;
    this.#transactionsService = transactionsService;
    this.#stateService = stateService;
    this.#logger = logger;

    // Set up connection recovery callback
    this.#subscriptionManager.onConnectionRecovery(async () => {
      await this.#recoverAllSubscriptions();
    });
  }

  /**
   * Initializes WebSocket connections and subscriptions for all user accounts.
   * @param accounts - The user accounts to subscribe to.
   * @param network - The network to connect to.
   */
  async initialize(
    accounts: SolanaKeyringAccount[],
    network: Network = Network.Mainnet,
  ): Promise<void> {
    try {
      this.#logger.info(
        '[WebSocketService] Initializing WebSocket connections',
      );

      // Open WebSocket connection
      await this.#subscriptionManager.openConnection(network);

      // Subscribe to all user accounts
      await this.subscribeToAllAccounts(accounts, network);

      this.#logger.info(
        '[WebSocketService] WebSocket service initialized successfully',
      );
    } catch (error) {
      this.#logger.error('[WebSocketService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Subscribes to all user accounts for real-time balance and transaction updates.
   * @param accounts - The accounts to subscribe to.
   * @param network - The network to subscribe on.
   */
  async subscribeToAllAccounts(
    accounts: SolanaKeyringAccount[],
    network: Network,
  ): Promise<void> {
    const subscriptionPromises = accounts.map(async (account) => {
      await this.subscribeToAccount(account.address, network);

      // Also subscribe to token accounts associated with this user account
      await this.#subscribeToTokenAccounts(account.address, network);
    });

    await Promise.all(subscriptionPromises);
    this.#logger.info(
      `[WebSocketService] Subscribed to ${accounts.length} user accounts`,
    );
  }

  /**
   * Subscribes to a specific account for balance and state changes.
   * @param accountAddress - The account address to subscribe to.
   * @param network - The network to subscribe on.
   * @returns A promise that resolves to the subscription ID.
   */
  async subscribeToAccount(
    accountAddress: string,
    network: Network,
  ): Promise<string> {
    // Check if already subscribed
    const existingSubscription = this.#accountSubscriptions.get(accountAddress);
    if (existingSubscription) {
      this.#logger.info(
        `[WebSocketService] Already subscribed to account: ${accountAddress}`,
      );
      return existingSubscription;
    }

    try {
      const subscriptionId = 'account_XXXxxxXXx';
      const subscription: JsonRpcSubscription = {
        id: subscriptionId,
        method: 'accountSubscribe',
        unsubscribeMethod: 'accountUnsubscribe',
        params: [accountAddress],
        onNotification: async (notification) => {
          await this.#handleAccountNotification(
            accountAddress,
            notification,
            network,
          );
        },
      };
      await this.#subscriptionManager.subscribe(network, subscription);

      // Track the subscription
      const subscriptionInfo: SubscriptionInfo = {
        subscriptionId,
        address: accountAddress,
        type: 'account',
        network,
        createdAt: Date.now(),
      };

      this.#activeSubscriptions.set(subscriptionId, subscriptionInfo);
      this.#accountSubscriptions.set(accountAddress, subscriptionId);

      this.#logger.info(
        `[WebSocketService] Subscribed to account: ${accountAddress}`,
      );
      return subscriptionId;
    } catch (error) {
      this.#logger.error(
        `[WebSocketService] Failed to subscribe to account ${accountAddress}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Subscribes to a transaction signature for confirmation status.
   * @param signature - The transaction signature to subscribe to.
   * @param network - The network to subscribe on.
   * @returns A promise that resolves to the subscription ID.
   */
  async subscribeToSignature(
    signature: string,
    network: Network,
  ): Promise<string> {
    // Check if already subscribed
    const existingSubscription = this.#signatureSubscriptions.get(signature);
    if (existingSubscription) {
      this.#logger.info(
        `[WebSocketService] Already subscribed to signature: ${signature}`,
      );
      return existingSubscription;
    }

    try {
      const subscriptionId = 'signature_XXXxxxXXx';
      const subscription: JsonRpcSubscription = {
        id: subscriptionId,
        method: 'signatureSubscribe',
        unsubscribeMethod: 'signatureUnsubscribe',
        params: [signature],
        onNotification: async (notification) => {
          await this.#handleSignatureNotification(
            signature,
            notification,
            network,
          );
        },
      };
      await this.#subscriptionManager.subscribe(network, subscription);

      // Track the subscription
      const subscriptionInfo: SubscriptionInfo = {
        subscriptionId,
        address: signature,
        type: 'signature',
        network,
        createdAt: Date.now(),
      };

      this.#activeSubscriptions.set(subscriptionId, subscriptionInfo);
      this.#signatureSubscriptions.set(signature, subscriptionId);

      // Set timeout to automatically unsubscribe if transaction doesn't finalize
      const timeout = setTimeout(() => {
        this.unsubscribeFromSignature(signature).catch((error) => {
          this.#logger.error(
            `[WebSocketService] Failed to cleanup signature subscription ${signature}:`,
            error,
          );
        });
      }, this.#signatureTimeoutMs);

      this.#signatureTimeouts.set(signature, timeout);

      this.#logger.info(
        `[WebSocketService] Subscribed to signature: ${signature}`,
      );
      return subscriptionId;
    } catch (error) {
      this.#logger.error(
        `[WebSocketService] Failed to subscribe to signature ${signature}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Unsubscribes from an account.
   * @param accountAddress - The account address to unsubscribe from.
   */
  async unsubscribeFromAccount(accountAddress: string): Promise<void> {
    const subscriptionId = this.#accountSubscriptions.get(accountAddress);
    if (!subscriptionId) {
      return;
    }

    await this.#subscriptionManager.unsubscribe(subscriptionId);
    this.#activeSubscriptions.delete(subscriptionId);
    this.#accountSubscriptions.delete(accountAddress);

    this.#logger.info(
      `[WebSocketService] Unsubscribed from account: ${accountAddress}`,
    );
  }

  /**
   * Unsubscribes from a signature.
   * @param signature - The signature to unsubscribe from.
   */
  async unsubscribeFromSignature(signature: string): Promise<void> {
    const subscriptionId = this.#signatureSubscriptions.get(signature);
    if (!subscriptionId) {
      return;
    }

    // Clear timeout if exists
    const timeout = this.#signatureTimeouts.get(signature);
    if (timeout) {
      clearTimeout(timeout);
      this.#signatureTimeouts.delete(signature);
    }

    await this.#subscriptionManager.unsubscribe(subscriptionId);
    this.#activeSubscriptions.delete(subscriptionId);
    this.#signatureSubscriptions.delete(signature);

    this.#logger.info(
      `[WebSocketService] Unsubscribed from signature: ${signature}`,
    );
  }

  /**
   * Gets all active subscriptions.
   * @returns An array of active subscription info.
   */
  getActiveSubscriptions(): SubscriptionInfo[] {
    return Array.from(this.#activeSubscriptions.values());
  }

  /**
   * Cleans up all subscriptions and closes connections.
   */
  async cleanup(): Promise<void> {
    this.#logger.info('[WebSocketService] Cleaning up WebSocket connections');

    // Clear all timeouts
    for (const timeout of this.#signatureTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.#signatureTimeouts.clear();

    // Unsubscribe from all
    const unsubscribePromises = Array.from(
      this.#activeSubscriptions.keys(),
    ).map(async (subscriptionId) => {
      await this.#subscriptionManager.unsubscribe(subscriptionId);
    });

    await Promise.allSettled(unsubscribePromises);

    // Clear tracking
    this.#activeSubscriptions.clear();
    this.#accountSubscriptions.clear();
    this.#signatureSubscriptions.clear();

    // Close connections
    await this.#subscriptionManager.closeConnection(Network.Mainnet);

    this.#logger.info('[WebSocketService] WebSocket service cleaned up');
  }

  /**
   * Handles account change notifications from WebSocket.
   * @param accountAddress - The account address that changed.
   * @param notification - The notification object containing the account data.
   * @param network - The network the account belongs to.
   */
  async #handleAccountNotification(
    accountAddress: string,
    notification: any,
    network: Network,
  ): Promise<void> {
    try {
      this.#logger.info(
        `[WebSocketService] Received account notification for ${accountAddress}:`,
        notification,
      );

      const { value } = notification;

      if (!value) {
        this.#logger.warn(
          `[WebSocketService] No value in account notification for ${accountAddress}`,
        );
        return;
      }

      // Check if this is a new token account creation
      await this.#checkForNewTokenAccounts(accountAddress, value, network);

      // Update account balance
      await this.#updateAccountBalance(accountAddress, value);

      // Fetch new transactions since the last known signature
      await this.#fetchNewTransactions(accountAddress as Address, network);

      this.#logger.info(
        `[WebSocketService] Processed account notification for ${accountAddress}`,
      );
    } catch (error) {
      this.#logger.error(
        `[WebSocketService] Error handling account notification for ${accountAddress}:`,
        error,
      );
    }
  }

  /**
   * Handles signature status notifications from WebSocket.
   * @param signature - The transaction signature to subscribe to.
   * @param notification - The notification object containing the signature data.
   * @param network - The network the signature belongs to.
   */
  async #handleSignatureNotification(
    signature: string,
    notification: any,
    network: Network,
  ): Promise<void> {
    try {
      this.#logger.info(
        `[WebSocketService] Received signature notification for ${signature}:`,
        notification,
      );

      const { value } = notification;

      if (value?.err) {
        this.#logger.warn(
          `[WebSocketService] Transaction failed: ${signature}`,
          value.err,
        );
      } else if (value) {
        this.#logger.info(
          `[WebSocketService] Transaction confirmed: ${signature}`,
        );

        // Fetch and process the confirmed transaction
        await this.#processConfirmedTransaction(
          signature as Signature,
          network,
        );
      }

      // Unsubscribe once transaction is finalized (success or failure)
      if (value !== null) {
        await this.unsubscribeFromSignature(signature);
      }
    } catch (error) {
      this.#logger.error(
        `[WebSocketService] Error handling signature notification for ${signature}:`,
        error,
      );
    }
  }

  /**
   * Subscribes to token accounts associated with a user account.
   * @param userAccountAddress - The user account address to subscribe to.
   * @param network - The network to subscribe on.
   */
  async #subscribeToTokenAccounts(
    userAccountAddress: string,
    network: Network,
  ): Promise<void> {
    try {
      // Get existing token accounts from state
      const existingAssets =
        (await this.#stateService.getKey(`assets.${userAccountAddress}`)) ?? {};

      for (const [, assetInfo] of Object.entries(existingAssets)) {
        if (
          typeof assetInfo === 'object' &&
          assetInfo !== null &&
          'tokenAccount' in assetInfo
        ) {
          const tokenAccountAddress = assetInfo.tokenAccount;
          if (tokenAccountAddress && typeof tokenAccountAddress === 'string') {
            await this.subscribeToAccount(tokenAccountAddress, network);
          }
        }
      }
    } catch (error) {
      this.#logger.error(
        `[WebSocketService] Failed to subscribe to token accounts for ${userAccountAddress}:`,
        error,
      );
    }
  }

  /**
   * Checks for new token account creation in account notifications.
   * @param accountAddress - The account address to check for new token accounts.
   * @param accountData - The account data to check for new token accounts.
   * @param network - The network to check for new token accounts.
   */
  async #checkForNewTokenAccounts(
    accountAddress: string,
    accountData: any,
    network: Network,
  ): Promise<void> {
    try {
      // Look for Create instruction in the account data
      if (
        accountData?.parsed?.type === 'account' &&
        accountData?.parsed?.info
      ) {
        const { info } = accountData.parsed;

        // If this is a token account, subscribe to it
        if (info.mint && info.owner) {
          this.#logger.info(
            `[WebSocketService] Found new token account: ${accountAddress} for mint: ${info.mint}`,
          );

          // Subscribe to this new token account
          await this.subscribeToAccount(accountAddress, network);

          // Refresh assets to include the new token account
          const ownerAddress = info.owner;
          await this.#assetsService
            .refreshAssets([{ address: ownerAddress } as SolanaKeyringAccount])
            .catch((error) => {
              this.#logger.warn(
                '[WebSocketService] Failed to refresh assets for new token account:',
                error,
              );
            });
        }
      }
    } catch (error) {
      this.#logger.error(
        `[WebSocketService] Error checking for new token accounts:`,
        error,
      );
    }
  }

  /**
   * Updates account balance in state.
   * @param accountAddress - The account address to update the balance for.
   * @param accountData - The account data to update the balance for.
   */
  async #updateAccountBalance(
    accountAddress: string,
    accountData: any,
  ): Promise<void> {
    try {
      // Update the balance information in state
      if (accountData?.lamports !== undefined) {
        await this.#stateService.setKey(
          `balance.${accountAddress}`,
          accountData.lamports,
        );
        this.#logger.info(
          `[WebSocketService] Updated balance for ${accountAddress}: ${accountData.lamports} lamports`,
        );
      }

      // If this is a token account, update token balance
      if (accountData?.parsed?.info?.tokenAmount) {
        const { tokenAmount } = accountData.parsed.info;
        await this.#stateService.setKey(
          `tokenBalance.${accountAddress}`,
          tokenAmount,
        );
        this.#logger.info(
          `[WebSocketService] Updated token balance for ${accountAddress}:`,
          tokenAmount,
        );
      }
    } catch (error) {
      this.#logger.error(
        `[WebSocketService] Failed to update account balance:`,
        error,
      );
    }
  }

  /**
   * Fetches new transactions for an account since the last known signature.
   * @param accountAddress - The account address to fetch new transactions for.
   * @param network - The network to fetch new transactions for.
   */
  async #fetchNewTransactions(
    accountAddress: Address,
    network: Network,
  ): Promise<void> {
    try {
      // Get the last known signatures for this account
      const existingSignatures =
        (await this.#stateService.getKey<Signature[]>(
          `signatures.${accountAddress}`,
        )) ?? [];

      // Fetch latest signatures
      const [latestSignature] =
        await this.#transactionsService.fetchLatestSignatures(
          network,
          accountAddress,
          1,
        );

      // If we have a new signature, refresh transactions
      if (latestSignature && !existingSignatures.includes(latestSignature)) {
        this.#logger.info(
          `[WebSocketService] Fetching new transactions for ${accountAddress}`,
        );

        await this.#transactionsService
          .refreshTransactions([
            { address: accountAddress } as SolanaKeyringAccount,
          ])
          .catch((error) => {
            this.#logger.warn(
              '[WebSocketService] Failed to refresh transactions:',
              error,
            );
          });
      }
    } catch (error) {
      this.#logger.error(
        `[WebSocketService] Failed to fetch new transactions:`,
        error,
      );
    }
  }

  /**
   * Processes a confirmed transaction.
   * @param signature - The transaction signature to process.
   * @param network - The network the transaction belongs to.
   */
  async #processConfirmedTransaction(
    signature: Signature,
    network: Network,
  ): Promise<void> {
    try {
      this.#logger.info(
        `[WebSocketService] Processing confirmed transaction: ${signature}`,
      );

      // Here you would typically:
      // 1. Fetch the full transaction details
      // 2. Update relevant account states
      // 3. Trigger any necessary side effects (notifications, etc.)

      // For now, we'll just log that the transaction was processed
      this.#logger.info(
        `[WebSocketService] Transaction ${signature} processed successfully`,
      );
    } catch (error) {
      this.#logger.error(
        `[WebSocketService] Failed to process confirmed transaction ${signature}:`,
        error,
      );
    }
  }

  /**
   * Recovers all subscriptions after a connection recovery.
   */
  async #recoverAllSubscriptions(): Promise<void> {
    try {
      this.#logger.info(
        '[WebSocketService] Recovering subscriptions after connection recovery',
      );

      // Implement message gap recovery here
      // This would typically involve:
      // 1. HTTP fallback to get missed updates
      // 2. Re-sync state with the latest blockchain state
      // 3. Re-establish subscriptions

      for (const [accountAddress] of this.#accountSubscriptions) {
        // Re-sync account state via HTTP
        await this.#fetchNewTransactions(
          accountAddress as Address,
          Network.Mainnet,
        );
      }

      this.#logger.info('[WebSocketService] Subscription recovery completed');
    } catch (error) {
      this.#logger.error(
        '[WebSocketService] Failed to recover subscriptions:',
        error,
      );
    }
  }
}
