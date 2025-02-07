import type { SecurityAlertsApiClient } from '../../clients/security-alerts-api/SecurityAlertsApiClient';
import type { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';

export class TransactionScanService {
  readonly #securityAlertsApiClient: SecurityAlertsApiClient;

  readonly #logger: ILogger;

  constructor(
    securityAlertsApiClient: SecurityAlertsApiClient,
    logger: ILogger,
  ) {
    this.#securityAlertsApiClient = securityAlertsApiClient;
    this.#logger = logger;
  }

  async scanTransaction({
    method,
    accountAddress,
    transaction,
    scope,
  }: {
    method: string;
    accountAddress: string;
    transaction: string;
    scope: Network;
  }): Promise<any> {
    try {
      const result = await this.#securityAlertsApiClient.scanTransactions({
        method,
        accountAddress,
        transactions: [transaction],
        scope,
        options: ['simulation', 'validation'],
      });

      return result;
    } catch (error) {
      this.#logger.error(error);
      return null;
    }
  }
}
