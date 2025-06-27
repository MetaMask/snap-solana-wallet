import type { IStateManager } from '../../core/services/state/IStateManager';
import type { UnencryptedStateValue } from '../../core/services/state/State';
import type { Subscription } from './types';

export class SubscriptionRepository {
  readonly #state: IStateManager<UnencryptedStateValue>;

  readonly #stateKey = 'subscriptions';

  constructor(state: IStateManager<UnencryptedStateValue>) {
    this.#state = state;
  }

  async getAll(): Promise<Subscription[]> {
    const subscriptions = await this.#state.getKey<Subscription[]>(
      `${this.#stateKey}`,
    );

    return subscriptions ?? [];
  }

  async save(subscription: Subscription): Promise<void> {
    await this.#state.setKey(
      `${this.#stateKey}.${subscription.id}`,
      subscription,
    );
  }

  async delete(subscriptionId: string): Promise<void> {
    await this.#state.deleteKey(`${this.#stateKey}.${subscriptionId}`);
  }

  async update(subscription: Subscription): Promise<void> {
    await this.#state.setKey(
      `${this.#stateKey}.${subscription.id}`,
      subscription,
    );
  }

  async findById(id: string): Promise<Subscription | undefined> {
    const subscription = await this.#state.getKey<Subscription>(
      `${this.#stateKey}.${id}`,
    );

    if (!subscription) {
      return undefined;
    }

    return subscription;
  }

  async findByRequestId(requestId: number): Promise<Subscription | undefined> {
    const subscriptions = await this.#state.getKey<Subscription[]>(
      `${this.#stateKey}`,
    );

    if (!subscriptions) {
      return undefined;
    }

    return subscriptions.find((item) => item.requestId === requestId);
  }

  async findByRpcSubscriptionId(
    rpcSubscriptionId: number,
  ): Promise<Subscription | undefined> {
    const subscriptions = await this.#state.getKey<Subscription[]>(
      `${this.#stateKey}`,
    );

    if (!subscriptions) {
      return undefined;
    }

    return subscriptions.find(
      (item) =>
        'rpcSubscriptionId' in item &&
        item.rpcSubscriptionId === rpcSubscriptionId,
    );
  }
}
