import type { SubscriptionConnectionManagerPort } from '../../ports/SubscriptionConnectionManagerPort';

export class OnStartHandler {
  constructor(
    private readonly subscriptionConnectionManager: SubscriptionConnectionManagerPort,
  ) {}
}
