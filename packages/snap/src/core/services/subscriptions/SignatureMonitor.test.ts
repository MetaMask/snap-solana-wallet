import { Network } from '../../constants/solana';
import type { SolanaConnection } from '../connection';
import { mockLogger } from '../mocks/logger';
import { SignatureMonitor } from './SignatureMonitor';
import type { SubscriptionService } from './SubscriptionService';

describe('SignatureMonitor', () => {
  let signatureMonitor: SignatureMonitor;
  let mockSubscriptionService: SubscriptionService;
  let mockConnection: SolanaConnection;
  let onConnectionRecoveryCallback: () => Promise<void>;
  let onNotificationCallback: () => Promise<void>;
  const mockSubscriptionId = 'subscription-id-123';

  beforeEach(() => {
    mockSubscriptionService = {
      subscribe: jest.fn(),
    } as unknown as SubscriptionService;

    // This will let us capture the callbacks passed to subscribe
    (mockSubscriptionService.subscribe as jest.Mock).mockImplementation(
      async (_, callbacks) => {
        onConnectionRecoveryCallback = callbacks.onConnectionRecovery;
        return Promise.resolve(mockSubscriptionId);
      },
    );

    mockConnection = {
      getRpc: jest.fn().mockImplementation(() => ({
        getSignatureStatuses: jest.fn().mockImplementation(() => ({
          send: jest.fn().mockReturnValue({
            value: [{ confirmationStatus: 'confirmed' }],
          }),
        })),
      })),
    } as unknown as SolanaConnection;

    signatureMonitor = new SignatureMonitor(
      mockSubscriptionService,
      mockConnection,
      mockLogger,
    );
  });

  describe('monitor', () => {
    const mockParams = {
      signature:
        '4s3KAUEZ9N5uwKurHNApnCSXVd6UxPD4VuHFtjcdT4WyXk5g5ZuscqqyJCjgssm81rL2BbjhJULHwBoe5jbNx5yS',
      commitment: 'confirmed' as const,
      network: Network.Mainnet,
      onCommitmentReached: jest.fn(),
    };

    it('registers a subscription to signatureSubscribe', async () => {
      await signatureMonitor.monitor(mockParams);

      expect(mockSubscriptionService.subscribe).toHaveBeenCalledWith(
        {
          method: 'signatureSubscribe',
          unsubscribeMethod: 'signatureUnsubscribe',
          network: Network.Mainnet,
          params: [
            mockParams.signature,
            {
              commitment: 'confirmed',
              enableReceivedNotification: false,
            },
          ],
        },
        {
          onNotification: expect.any(Function),
          onConnectionRecovery: expect.any(Function),
        },
      );
    });

    describe('#handleNotification', () => {
      beforeEach(() => {
        // This will let us capture the callbacks passed to subscribe
        (mockSubscriptionService.subscribe as jest.Mock).mockImplementation(
          async (_, callbacks) => {
            onNotificationCallback = callbacks.onNotification;
            return Promise.resolve(mockSubscriptionId);
          },
        );
      });

      it('calls onCommitmentReached when notification received', async () => {
        await signatureMonitor.monitor(mockParams);

        // Simulate notification received
        await onNotificationCallback();

        expect(mockParams.onCommitmentReached).toHaveBeenCalledWith(mockParams);
      });

      it('doesnt fail if onCommitmentReached throws an error', async () => {
        const mockParamsWithError = {
          signature: 'signature',
          commitment: 'confirmed' as const,
          network: Network.Mainnet,
          onCommitmentReached: jest.fn().mockRejectedValue(new Error('test')),
        };

        expect(
          await signatureMonitor.monitor(mockParamsWithError),
        ).toBeUndefined();

        // Simulate notification received
        await onNotificationCallback();

        expect(mockParamsWithError.onCommitmentReached).toHaveBeenCalledWith(
          mockParamsWithError,
        );
      });
    });

    describe('#handleConnectionRecovery', () => {
      it('calls onCommitmentReached when connection was dropped and recovered', async () => {
        await signatureMonitor.monitor(mockParams);

        // Simulate connection recovery
        await onConnectionRecoveryCallback();

        expect(mockParams.onCommitmentReached).toHaveBeenCalledWith(mockParams);
      });
    });
  });
});
