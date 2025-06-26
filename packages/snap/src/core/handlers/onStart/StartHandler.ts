import type { ConnectionManagerPort } from '../../ports/subscriptions';
import type { IStateManager } from '../../services/state/IStateManager';
import type { UnencryptedStateValue } from '../../services/state/State';

export class StartHandler {
  readonly #subscriptionConnectionManager: ConnectionManagerPort;

  readonly #state: IStateManager<UnencryptedStateValue>;

  constructor(
    subscriptionConnectionManager: ConnectionManagerPort,
    state: IStateManager<UnencryptedStateValue>,
  ) {
    this.#subscriptionConnectionManager = subscriptionConnectionManager;
    this.#state = state;
  }

  async handle(): Promise<void> {
    // Wipe the subscriptions state
    await this.#state.deleteKey('subscriptions');

    // Open the subscription connections for all networks
    await this.#subscriptionConnectionManager.setupAllConnections();

    // Init the subscriptions
    // await this.#accountWatcher
  }
}
