import type { SecurityAlertsApiClient } from '../../clients/security-alerts-api/SecurityAlertsApiClient';
import type { SecurityAlertSimulationValidationResponse } from '../../clients/security-alerts-api/types';
import type { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import type { TransactionScanResult } from './types';

const ICON_SIZE = 16;

export class TransactionScanService {
  readonly #securityAlertsApiClient: SecurityAlertsApiClient;

  readonly #logger: ILogger;

  readonly #tokenMetadataService: TokenMetadataService;

  constructor(
    securityAlertsApiClient: SecurityAlertsApiClient,
    tokenMetadataService: TokenMetadataService,
    logger: ILogger,
  ) {
    this.#securityAlertsApiClient = securityAlertsApiClient;
    this.#tokenMetadataService = tokenMetadataService;
    this.#logger = logger;
  }

  /**
   * Scans a transaction.
   * @param params - The parameters for the function.
   * @param params.method - The method of the transaction.
   * @param params.accountAddress - The address of the account.
   * @param params.transaction - The transaction to scan.
   * @param params.scope - The scope of the transaction.
   * @param params.origin - The origin of the transaction.
   * @param params.options - The options for the scan.
   * @returns The result of the scan.
   */
  async scanTransaction({
    method,
    accountAddress,
    transaction,
    scope,
    origin,
    options = ['simulation', 'validation'],
  }: {
    method: string;
    accountAddress: string;
    transaction: string;
    scope: Network;
    origin: string;
    options?: string[];
  }): Promise<TransactionScanResult | null> {
    try {
      const result = await this.#securityAlertsApiClient.scanTransactions({
        method,
        accountAddress,
        transactions: [transaction],
        scope,
        origin,
        options,
      });

      const scan = this.#mapScan(result);

      if (!scan?.estimatedChanges?.assets) {
        return null;
      }

      const updatedScan = { ...scan };

      const transactionScanIconPromises = scan.estimatedChanges.assets.map(
        async (asset, index) => {
          const { logo } = asset;

          if (logo) {
            return this.#tokenMetadataService
              .generateImageComponent(logo, ICON_SIZE, ICON_SIZE)
              .then((image) => {
                if (image && updatedScan?.estimatedChanges?.assets?.[index]) {
                  updatedScan.estimatedChanges.assets[index].imageSvg = image;
                }
              })
              .catch(() => {
                return null;
              });
          }

          return undefined;
        },
      );

      await Promise.all(transactionScanIconPromises ?? []);

      return updatedScan;
    } catch (error) {
      this.#logger.error(error);
      return null;
    }
  }

  #mapScan(
    result: SecurityAlertSimulationValidationResponse,
  ): TransactionScanResult {
    return {
      status: result?.status,
      estimatedChanges: {
        assets:
          result.result?.simulation?.account_summary?.account_assets_diff?.map(
            (asset) => ({
              type: asset.in ? 'in' : 'out',
              symbol:
                'symbol' in asset.asset ? asset.asset.symbol : asset.asset_type,
              name: 'name' in asset.asset ? asset.asset.name : asset.asset_type,
              logo: 'logo' in asset.asset ? asset.asset.logo : null,
              value: asset.in?.value ?? asset.out?.value ?? null,
              price: asset.in?.usd_price ?? asset.out?.usd_price ?? null,
              imageSvg: null,
            }),
          ) ?? [],
      },
      validation: {
        type: result.result?.validation?.result_type,
        reason: result.result?.validation?.reason,
      },
      error: result?.error_details
        ? {
            type:
              'type' in result.error_details ? result.error_details.type : null,
            code:
              'code' in result.error_details ? result.error_details.code : null,
          }
        : null,
    };
  }
}
