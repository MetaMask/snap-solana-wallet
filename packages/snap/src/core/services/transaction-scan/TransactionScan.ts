import type { SecurityAlertsApiClient } from '../../clients/security-alerts-api/SecurityAlertsApiClient';
import type { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { TransactionScanResult } from './types';

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

  /**
   * Scans a transaction.
   * @param params - The parameters for the function.
   * @param params.method - The method of the transaction.
   * @param params.accountAddress - The address of the account.
   * @param params.transaction - The transaction to scan.
   * @param params.scope - The scope of the transaction.
   * @returns The result of the scan.
   */
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
  }): Promise<TransactionScanResult | null> {
    try {
      const result = await this.#securityAlertsApiClient.scanTransactions({
        method,
        accountAddress,
        transactions: [transaction],
        scope,
        options: ['simulation', 'validation'],
      });

      return {
        status: result.status,
        estimatedChanges: {
          assets:
            result.result?.simulation?.account_summary?.account_assets_diff?.map(
              (asset) => ({
                type: asset.in ? 'in' : 'out',
                symbol:
                  'symbol' in asset.asset
                    ? asset.asset.symbol
                    : asset.asset_type,
                name:
                  'name' in asset.asset ? asset.asset.name : asset.asset_type,
                logo: 'logo' in asset.asset ? asset.asset.logo : null,
                value: asset.in?.value ?? asset.out?.value ?? null,
                price: asset.in?.usd_price ?? asset.out?.usd_price ?? null,
              }),
            ),
        },
        validation: {
          type: result.result?.validation?.result_type,
          reason: result.result?.validation?.reason,
        },
      };
    } catch (error) {
      this.#logger.error(error);
      return null;
    }
  }
}
