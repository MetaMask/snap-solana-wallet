import { address, lamports } from '@solana/kit';

import { Network } from '../../constants/solana';
import type { SolanaConnection } from '../connection';
import { mockLogger } from '../mocks/logger';
import type { AccountNotification } from './AccountMonitor';
import { AccountMonitor } from './AccountMonitor';
import type { SubscriptionService } from './SubscriptionService';

describe('AccountMonitor', () => {
  let accountMonitor: AccountMonitor;
  let mockSubscriptionService: SubscriptionService;
  let mockConnection: SolanaConnection;
  let onConnectionRecoveryCallback: () => Promise<void>;
  let onNotificationCallback: (
    notification: AccountNotification,
  ) => Promise<void>;
  const mockSubscriptionId = 'subscription-id-123';

  const params = {
    address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
    commitment: 'confirmed' as const,
    network: Network.Mainnet,
    onAccountChanged: jest.fn(),
  };

  const mockAccountInfo = {
    context: {
      slot: BigInt(123),
    },
    value: {
      executable: false,
      lamports: lamports(2039280n),
      owner: address('8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC'),
      rentEpoch: BigInt(361),
      space: BigInt(165),
      data: {
        parsed: {
          info: {
            isNative: false,
            mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
            owner: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
            state: 'initialized',
            tokenAmount: {
              amount: '6391459524',
              decimals: 5,
              uiAmount: 63914.59524,
              uiAmountString: '63914.59524',
            },
          },
          type: 'account',
        },
        program: 'spl-token',
        space: BigInt(165),
      },
    },
  };

  beforeEach(() => {
    mockSubscriptionService = {
      subscribe: jest.fn().mockResolvedValue(mockSubscriptionId),
      unsubscribe: jest.fn(),
    } as unknown as SubscriptionService;

    // This will let us capture the callbacks passed to subscribe
    (mockSubscriptionService.subscribe as jest.Mock).mockImplementation(
      async (_, callbacks) => {
        onNotificationCallback = callbacks.onNotification;
        onConnectionRecoveryCallback = callbacks.onConnectionRecovery;
        return Promise.resolve(mockSubscriptionId);
      },
    );

    mockConnection = {
      getRpc: jest.fn().mockImplementation(() => ({
        getAccountInfo: jest.fn().mockImplementation(() => ({
          send: jest.fn().mockReturnValue(mockAccountInfo),
        })),
      })),
    } as unknown as SolanaConnection;

    accountMonitor = new AccountMonitor(
      mockSubscriptionService,
      mockConnection,
      mockLogger,
    );
  });

  describe('monitor', () => {
    it('registers a subscription to accountSubscribe', async () => {
      await accountMonitor.monitor(params);

      expect(mockSubscriptionService.subscribe).toHaveBeenCalledWith(
        {
          method: 'accountSubscribe',
          unsubscribeMethod: 'accountUnsubscribe',
          network: Network.Mainnet,
          params: [
            params.address,
            { commitment: 'confirmed', encoding: 'jsonParsed' },
          ],
        },
        {
          onNotification: expect.any(Function),
          onConnectionRecovery: expect.any(Function),
        },
      );
    });

    it('returns the subscription ID', async () => {
      const subscriptionId = await accountMonitor.monitor(params);
      expect(subscriptionId).toBe(mockSubscriptionId);
    });
  });

  describe('#handleNotification', () => {
    it('calls the onAccountChanged callback when the account changes', async () => {
      await accountMonitor.monitor(params);

      // Simulate notification received
      await onNotificationCallback(mockAccountInfo);

      expect(params.onAccountChanged).toHaveBeenCalledWith(
        mockAccountInfo,
        params,
      );
    });

    it('doesnt fail if onAccountChanged throws an error', async () => {
      const paramsWithError = {
        address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
        commitment: 'confirmed' as const,
        network: Network.Mainnet,
        onAccountChanged: jest.fn().mockRejectedValue(new Error('test')),
      };

      expect(await accountMonitor.monitor(paramsWithError)).toBe(
        mockSubscriptionId,
      );

      // Simulate notification received
      await onNotificationCallback(mockAccountInfo);

      expect(paramsWithError.onAccountChanged).toHaveBeenCalledWith(
        mockAccountInfo,
        paramsWithError,
      );
    });
  });

  describe('#handleConnectionRecovery', () => {
    it('calls the onAccountChanged callback when the account changes', async () => {
      await accountMonitor.monitor(params);

      // Simulate connection recovery
      await onConnectionRecoveryCallback();

      expect(params.onAccountChanged).toHaveBeenCalledWith(
        mockAccountInfo,
        params,
      );
    });
  });

  describe('stopMonitoring', () => {
    it('unsubscribes from the subscription', async () => {
      const subscriptionId = await accountMonitor.monitor(params);

      await accountMonitor.stopMonitoring(subscriptionId);

      expect(mockSubscriptionService.unsubscribe).toHaveBeenCalledWith(
        subscriptionId,
      );
    });
  });
});
