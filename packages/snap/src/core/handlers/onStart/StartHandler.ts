import type { SubscriptionConnectionManagerPort } from '../../ports/SubscriptionConnectionManagerPort';

export class StartHandler {
  constructor(
    private readonly subscriptionConnectionManager: SubscriptionConnectionManagerPort,
  ) {}

  async handle(): Promise<void> {
    // Wipe the subscriptions state
    // Open the connections for all networks
    // Init the subscriptions
  }
}
