import type { Transaction } from '@metamask/keyring-api';
import type { Json } from '@metamask/utils';

import type { SolanaKeyringAccount } from '../../../entities';
import type { Network, TransactionMetadata } from '../../constants/solana';
import { trackError } from '../../utils/errors';
import type { ILogger } from '../../utils/logger';
import logger, { createPrefixedLogger } from '../../utils/logger';
import type {
  ScanStatus,
  SecurityAlertResponse,
} from '../transaction-scan/types';

/**
 * Service for tracking events related to transactions.
 */
export class AnalyticsService {
  readonly #logger: ILogger;

  constructor(_logger = logger) {
    this.#logger = createPrefixedLogger(_logger, '[📣 AnalyticsService]');
  }

  async #trackEvent(
    event: string,
    properties: Record<string, Json>,
  ): Promise<void> {
    try {
      this.#logger.log(`Tracking event ${event}`);

      await snap.request({
        method: 'snap_trackEvent',
        params: {
          event: {
            event,
            properties,
          },
        },
      });
    } catch (error) {
      await trackError(error);
      this.#logger.warn('Error tracking event', {
        error,
        event,
        properties,
      });
    }
  }

  async trackEventTransactionAdded(
    account: SolanaKeyringAccount,
    metadata: TransactionMetadata,
  ): Promise<void> {
    await this.#trackEvent('Transaction Added', {
      message: 'Snap transaction added',
      origin: metadata.origin,
      account_type: account.type,
      chain_id_caip: metadata.scope,
    });
  }

  async trackEventTransactionApproved(
    account: SolanaKeyringAccount,
    metadata: TransactionMetadata,
  ): Promise<void> {
    await this.#trackEvent('Transaction Approved', {
      message: 'Snap transaction approved',
      origin: metadata.origin,
      account_type: account.type,
      chain_id_caip: metadata.scope,
    });
  }

  async trackEventTransactionSubmitted(
    account: SolanaKeyringAccount,
    signature: string,
    metadata: TransactionMetadata,
  ): Promise<void> {
    await this.#trackEvent('Transaction Submitted', {
      message: 'Snap transaction submitted',
      origin: metadata.origin,
      account_type: account.type,
      chain_id_caip: metadata.scope,
    });
  }

  async trackEventTransactionFinalized(
    account: SolanaKeyringAccount,
    transaction: Transaction,
    metadata: TransactionMetadata,
  ): Promise<void> {
    await this.#trackEvent('Transaction Finalized', {
      message: 'Snap transaction finalized',
      origin: metadata.origin,
      account_type: account.type,
      chain_id_caip: transaction.chain,
      transaction_status: transaction.status,
      transaction_type: transaction.type,
    });
  }

  async trackEventTransactionRejected(
    account: SolanaKeyringAccount,
    metadata: TransactionMetadata,
  ): Promise<void> {
    await this.#trackEvent('Transaction Rejected', {
      message: 'Snap transaction rejected',
      origin: metadata.origin,
      account_type: account.type,
      chain_id_caip: metadata.scope,
    });
  }

  async trackEventSecurityAlertDetected(
    account: SolanaKeyringAccount,
    origin: string,
    scope: Network,
    securityAlertResponse: SecurityAlertResponse,
    securityAlertReason: string | null,
    securityAlertDescription: string,
  ): Promise<void> {
    await this.#trackEvent('Security Alert Detected', {
      message: 'Snap security alert detected',
      origin,
      account_type: account.type,
      chain_id_caip: scope,
      security_alert_response: securityAlertResponse,
      security_alert_reason: securityAlertReason,
      security_alert_description: securityAlertDescription,
    });
  }

  async trackEventSecurityScanCompleted(
    account: SolanaKeyringAccount,
    origin: string,
    scope: Network,
    scanStatus: ScanStatus,
    hasSecurityAlerts: boolean,
  ): Promise<void> {
    await this.#trackEvent('Security Scan Completed', {
      message: 'Snap security scan completed',
      origin,
      account_type: account.type,
      chain_id_caip: scope,
      scan_status: scanStatus,
      has_security_alerts: hasSecurityAlerts,
    });
  }

  async trackEventWebSocketConnectionClosedNotCleanly(
    origin: string,
    code: number,
    reason: string | null,
  ): Promise<void> {
    await this.#trackEvent('WebSocket Connection Closed Not Cleanly', {
      message: 'Snap WebSocket connection closed not cleanly',
      origin,
      code,
      reason,
    });
  }
}
