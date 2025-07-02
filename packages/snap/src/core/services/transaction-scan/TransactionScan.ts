/* eslint-disable @typescript-eslint/naming-convention */
import type { SolanaKeyringAccount } from '../../../entities';
import type { SecurityAlertsApiClient } from '../../clients/security-alerts-api/SecurityAlertsApiClient';
import type { SecurityAlertSimulationValidationResponse } from '../../clients/security-alerts-api/types';
import type { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { AnalyticsService } from '../analytics/AnalyticsService';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import type { TransactionScanResult, TransactionScanValidation } from './types';
import { ScanStatus, SecurityAlertResponse } from './types';

const ICON_SIZE = 16;

export class TransactionScanService {
  readonly #securityAlertsApiClient: SecurityAlertsApiClient;

  readonly #logger: ILogger;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #analyticsService: AnalyticsService;

  constructor(
    securityAlertsApiClient: SecurityAlertsApiClient,
    tokenMetadataService: TokenMetadataService,
    analyticsService: AnalyticsService,
    logger: ILogger,
  ) {
    this.#securityAlertsApiClient = securityAlertsApiClient;
    this.#tokenMetadataService = tokenMetadataService;
    this.#analyticsService = analyticsService;
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
   * @param params.account - The account for analytics tracking.
   * @returns The result of the scan.
   */
  async scanTransaction({
    method,
    accountAddress,
    transaction,
    scope,
    origin,
    options = ['simulation', 'validation'],
    account,
  }: {
    method: string;
    accountAddress: string;
    transaction: string;
    scope: Network;
    origin: string;
    options?: string[];
    account?: SolanaKeyringAccount;
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

      // Validate scan object before proceeding
      if (!scan || !scan.status) {
        this.#logger.warn('Invalid scan result received from security alerts API');
        
        if (account) {
          await this.#analyticsService.trackEventSecurityScanCompleted(
            account,
            transaction,
            origin,
            scope,
            ScanStatus.ERROR,
            false,
          );
        }
        
        return null;
      }

      // The security scan is completed
      if (account) {
        const analyticsPromises = [
          this.#analyticsService.trackEventSecurityScanCompleted(
            account,
            transaction,
            origin,
            scope,
            scan.status as ScanStatus,
            scan.validation?.type !== SecurityAlertResponse.Benign,
          ),
        ];

        // And the alert is detected - only if validation exists and is not benign
        if (scan.validation?.type && scan.validation.type !== SecurityAlertResponse.Benign) {
          analyticsPromises.push(
            this.#analyticsService.trackEventSecurityAlertDetected(
              account,
              transaction,
              origin,
              scope,
              scan.validation.type as SecurityAlertResponse,
              scan.validation.reason || 'unknown',
              this.#getSecurityAlertDescription(scan.validation),
            ),
          );
        }

        // Run all analytics calls in parallel
        await Promise.all(analyticsPromises);
      }

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

      if (account) {
        await this.#analyticsService.trackEventSecurityScanCompleted(
          account,
          transaction,
          origin,
          scope,
          ScanStatus.ERROR,
          false,
        );
      }

      return null;
    }
  }

  #getSecurityAlertDescription(validation: TransactionScanValidation): string {
    // Add null/undefined check for validation and reason
    if (!validation || !validation.reason) {
      return 'Security alert: Unknown reason';
    }

    // Reference: https://docs.blockaid.io/reference/response-reference-solana
    const reasonDescriptions: Record<string, string> = {
      unfair_trade:
        "Unfair trade of assets, without adequate compensation to the owner's account",
      transfer_farming:
        "Substantial transfer of the account's assets to untrusted entities",
      writable_accounts_farming:
        'Transaction exposes unused writable account, can be utilized in BIT-FLIP attacks patterns',
      native_ownership_change:
        'The account transferred ownership of its native SOL to untrusted entities',
      spl_token_ownership_change:
        'The account transferred ownership of its SPL tokens to untrusted entities',
      exposure_farming:
        'The account delegates ownership, thereby exposing its assets to untrusted spenders',
      known_attacker:
        "A known attacker's account is involved in the transaction",
      invalid_signature:
        'One of the transactions provided contains non valid signatures, that can lead misleading simulation results',
      honeypot:
        'The account invests funds in a token that is part of an orchestrated honeypot scheme',
      other:
        'The transaction was marked as malicious for other reason, further details would be described in features field',
    };

    return (
      reasonDescriptions[validation.reason] ??
      `Security alert: ${validation.reason}`
    );
  }

  #mapScan(
    result: SecurityAlertSimulationValidationResponse,
  ): TransactionScanResult | null {
    // Validate that we have a basic result structure
    if (!result) {
      return null;
    }

    return {
      status: result.status || 'ERROR',
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
        type: result.result?.validation?.result_type || null,
        reason: result.result?.validation?.reason || null,
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
