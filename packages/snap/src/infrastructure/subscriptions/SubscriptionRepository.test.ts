import { Network } from '../../core/constants/solana';
import type { IStateManager } from '../../core/services/state/IStateManager';
import type { UnencryptedStateValue } from '../../core/services/state/State';
import type { Subscription } from '../../entities';
import { SubscriptionRepository } from './SubscriptionRepository';

const createMockSubscription = (id: string): Subscription => ({
  id,
  network: Network.Mainnet,
  status: 'pending',
  requestId: id,
  method: 'accountSubscribe',
  unsubscribeMethod: 'accountUnsubscribe',
  params: [],
  createdAt: new Date().toISOString(),
});

describe('SubscriptionRepository', () => {
  let repository: SubscriptionRepository;
  let mockStateManager: IStateManager<UnencryptedStateValue>;

  beforeEach(() => {
    mockStateManager = {
      get: jest.fn(),
      getKey: jest.fn(),
      setKey: jest.fn(),
      update: jest.fn(),
      deleteKey: jest.fn(),
    };

    repository = new SubscriptionRepository(mockStateManager);
  });

  describe('getAll', () => {
    it('returns an empty array if there are no subscriptions', async () => {
      jest.spyOn(mockStateManager, 'getKey').mockResolvedValue({});

      const subscriptions = await repository.getAll();
      expect(subscriptions).toStrictEqual([]);
    });

    it('returns the subscriptions if there are any', async () => {
      const subscription0 = createMockSubscription('0');
      const subscription1 = createMockSubscription('1');

      jest.spyOn(mockStateManager, 'getKey').mockResolvedValue({
        [subscription0.id]: subscription0,
        [subscription1.id]: subscription1,
      });

      const subscriptions = await repository.getAll();
      expect(subscriptions).toStrictEqual([subscription0, subscription1]);
    });
  });

  describe('save', () => {
    it('saves the subscription', async () => {
      const subscription = createMockSubscription('0');

      await repository.save(subscription);
      expect(mockStateManager.setKey).toHaveBeenCalledWith(
        'subscriptions.0',
        subscription,
      );
    });
  });

  describe('delete', () => {
    it('deletes the subscription', async () => {
      const subscription = createMockSubscription('0');

      await repository.delete(subscription.id);
      expect(mockStateManager.deleteKey).toHaveBeenCalledWith(
        'subscriptions.0',
      );
    });
  });

  describe('deleteAll', () => {
    it('deletes all subscriptions', async () => {
      await repository.deleteAll();
      expect(mockStateManager.deleteKey).toHaveBeenCalledWith('subscriptions');
    });
  });

  describe('update', () => {
    it('updates the subscription', async () => {
      const subscription = createMockSubscription('0');

      await repository.update(subscription);
      expect(mockStateManager.setKey).toHaveBeenCalledWith(
        'subscriptions.0',
        subscription,
      );
    });
  });

  describe('findBy', () => {
    it('finds the subscription by the requestId', async () => {
      const subscription = createMockSubscription('0');

      jest.spyOn(mockStateManager, 'getKey').mockResolvedValue({
        [subscription.id]: subscription,
      });

      const foundSubscription = await repository.findBy(
        'requestId',
        subscription.requestId,
      );

      expect(foundSubscription).toStrictEqual(subscription);
    });

    it('returns undefined if the subscription is not found', async () => {
      const subscription = createMockSubscription('0');

      jest.spyOn(mockStateManager, 'getKey').mockResolvedValue({
        [subscription.id]: subscription,
      });

      // Try to find a different subscription
      const foundSubscription = await repository.findBy('requestId', '1');

      expect(foundSubscription).toBeUndefined();
    });

    it('returns undefined if there are no subscriptions', async () => {
      jest.spyOn(mockStateManager, 'getKey').mockResolvedValue({});

      const foundSubscription = await repository.findBy('requestId', '1');
      expect(foundSubscription).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('clears all subscriptions', async () => {
      await repository.clear();
      expect(mockStateManager.deleteKey).toHaveBeenCalledWith('subscriptions');
    });
  });
});
