/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Transaction } from '@metamask/keyring-api';

import type {
  ConnectionRecoveryHandler,
  SignatureNotification,
  SignatureNotificationHandler,
  Subscription,
} from '../../../entities';
import { Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../test/mocks/solana-keyring-accounts';
import type { AccountsService } from '../accounts';
import type { AnalyticsService } from '../analytics/AnalyticsService';
import type { ConfigProvider } from '../config';
import type { Config } from '../config/ConfigProvider';
import type { SolanaConnection } from '../connection';
import { mockLogger } from '../mocks/logger';
import type { TransactionsService } from '../transactions/TransactionsService';
import { SignatureMonitor } from './SignatureMonitor';
import type { SubscriptionService } from './SubscriptionService';

describe('SignatureMonitor', () => {
  let signatureMonitor: SignatureMonitor;
  let mockSubscriptionService: SubscriptionService;
  let mockAccountService: AccountsService;
  let mockTransactionsService: TransactionsService;
  let mockAnalyticsService: AnalyticsService;
  let mockConnection: SolanaConnection;
  let mockConfigProvider: ConfigProvider;

  const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNTS[0]!;

  const signature =
    '4s3KAUEZ9N5uwKurHNApnCSXVd6UxPD4VuHFtjcdT4WyXk5g5ZuscqqyJCjgssm81rL2BbjhJULHwBoe5jbNx5yS';
  const accountId = mockAccount.id;
  const commitment = 'confirmed' as const;
  const network = Network.Mainnet;
  const origin = 'test';

  const mockTransaction = {
    id: signature,
  } as Transaction;

  let notificationHandlers: SignatureNotificationHandler[] = [];
  let connectionRecoveryHandlers: ConnectionRecoveryHandler[] = [];

  beforeEach(() => {
    notificationHandlers = [];
    connectionRecoveryHandlers = [];

    mockSubscriptionService = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      registerNotificationHandler: jest
        .fn()
        .mockImplementation(async (_method, _network, handler) => {
          // This will let us capture and manually call the handler
          notificationHandlers.push(handler);
        }),
      registerConnectionRecoveryHandler: jest
        .fn()
        .mockImplementation(async (_network, handler) => {
          // This will let us capture and manually call the handler
          connectionRecoveryHandlers.push(handler);
        }),
    } as unknown as SubscriptionService;

    mockAccountService = {
      findById: jest.fn().mockResolvedValue(mockAccount),
    } as unknown as AccountsService;

    mockTransactionsService = {
      fetchBySignature: jest.fn().mockResolvedValue(mockTransaction),
      saveTransaction: jest.fn(),
    } as unknown as TransactionsService;

    mockAnalyticsService = {
      trackEventTransactionFinalized: jest.fn(),
      trackEventTransactionSubmitted: jest.fn(),
    } as unknown as AnalyticsService;

    mockConnection = {
      getRpc: jest.fn().mockImplementation(() => ({
        getSignatureStatuses: jest.fn().mockImplementation(() => ({
          send: jest.fn().mockReturnValue({
            value: [{ confirmationStatus: 'confirmed' }],
          }),
        })),
      })),
    } as unknown as SolanaConnection;

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config),
    } as unknown as ConfigProvider;

    signatureMonitor = new SignatureMonitor(
      mockSubscriptionService,
      mockAccountService,
      mockTransactionsService,
      mockAnalyticsService,
      mockConnection,
      mockConfigProvider,
      mockLogger,
    );
  });

  describe('monitor', () => {
    it('subscribes to method signatureSubscribe', async () => {
      await signatureMonitor.monitor(
        signature,
        accountId,
        commitment,
        network,
        origin,
      );

      expect(mockSubscriptionService.subscribe).toHaveBeenCalledWith({
        method: 'signatureSubscribe',
        network: Network.Mainnet,
        params: [
          signature,
          {
            commitment: 'confirmed',
            enableReceivedNotification: false,
          },
        ],
        metadata: {
          accountId,
          origin,
        },
      });
    });

    it('registers a connection recovery handler', async () => {
      await signatureMonitor.monitor(
        signature,
        accountId,
        commitment,
        network,
        origin,
      );

      expect(
        mockSubscriptionService.registerConnectionRecoveryHandler,
      ).toHaveBeenCalledWith(network, expect.any(Function));
    });
  });

  describe('#handleSignatureNotification', () => {
    it('when the tx is processed, it saves the transaction, tracks an event in analytics, and unsubscribes', async () => {
      const mockNotification = {} as unknown as SignatureNotification;
      const mockSubscription = {
        id: 'subscription-id-123',
        method: 'signatureSubscribe',
        network: Network.Mainnet,
        params: [
          signature,
          { commitment: 'processed', enableReceivedNotification: false },
        ],
        metadata: {
          accountId,
          origin,
        },
      } as unknown as Subscription;

      await signatureMonitor.monitor(
        signature,
        accountId,
        'processed',
        network,
        origin,
      );

      // Simulate notification received
      const handler = notificationHandlers[0]!;
      await handler(mockNotification, mockSubscription);

      expect(mockTransactionsService.saveTransaction).toHaveBeenCalledWith(
        mockTransaction,
        mockAccount,
      );

      expect(
        mockAnalyticsService.trackEventTransactionSubmitted,
      ).toHaveBeenCalledWith(mockAccount, signature, {
        origin,
        scope: network,
      });

      expect(mockSubscriptionService.unsubscribe).toHaveBeenCalledWith(
        mockSubscription.id,
      );
    });

    it('when the tx is confirmed, it saves the transaction, tracks an event in analytics, and unsubscribes', async () => {
      const mockNotification = {} as unknown as SignatureNotification;
      const mockSubscription = {
        id: 'subscription-id-123',
        method: 'signatureSubscribe',
        network: Network.Mainnet,
        params: [signature, { commitment, enableReceivedNotification: false }],
        metadata: {
          accountId,
          origin,
        },
      } as unknown as Subscription;

      await signatureMonitor.monitor(
        signature,
        accountId,
        'confirmed',
        network,
        origin,
      );

      // Simulate notification received
      const handler = notificationHandlers[0]!;
      await handler(mockNotification, mockSubscription);

      expect(mockTransactionsService.saveTransaction).toHaveBeenCalledWith(
        mockTransaction,
        mockAccount,
      );

      expect(
        mockAnalyticsService.trackEventTransactionFinalized,
      ).toHaveBeenCalledWith(mockAccount, mockTransaction, {
        origin,
        scope: network,
      });

      expect(mockSubscriptionService.unsubscribe).toHaveBeenCalledWith(
        mockSubscription.id,
      );
    });
  });

  describe('#handleConnectionRecovery', () => {
    it('fetches, saves the transaction and tracks an event in analytics when connection was dropped and recovered, if the tx has reached the desired commitment', async () => {
      await signatureMonitor.monitor(
        signature,
        accountId,
        commitment,
        network,
        origin,
      );

      (mockTransactionsService.fetchBySignature as jest.Mock).mockClear();
      (mockTransactionsService.saveTransaction as jest.Mock).mockClear();

      // Simulate connection recovery
      const handler = connectionRecoveryHandlers[0]!;
      await handler(network);

      expect(mockTransactionsService.fetchBySignature).toHaveBeenCalled();
      expect(mockTransactionsService.saveTransaction).toHaveBeenCalled();
      expect(
        mockAnalyticsService.trackEventTransactionFinalized,
      ).toHaveBeenCalled();
    });
  });

  it('does nothing if the tx has not reached the desired commitment', async () => {
    // The transaction is only processed, not confirmed
    jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
      getSignatureStatuses: jest.fn().mockReturnValue({
        send: jest.fn().mockReturnValue({
          value: [{ confirmationStatus: 'processed' }],
        }),
      }),
    } as any);

    await signatureMonitor.monitor(
      signature,
      accountId,
      'confirmed',
      network,
      origin,
    );

    (mockTransactionsService.fetchBySignature as jest.Mock).mockClear();
    (mockTransactionsService.saveTransaction as jest.Mock).mockClear();

    // Simulate connection recovery
    const handler = connectionRecoveryHandlers[0]!;
    await handler(network);

    expect(mockTransactionsService.fetchBySignature).not.toHaveBeenCalled();
    expect(mockTransactionsService.saveTransaction).not.toHaveBeenCalled();
    expect(
      mockAnalyticsService.trackEventTransactionFinalized,
    ).not.toHaveBeenCalled();
  });
});
