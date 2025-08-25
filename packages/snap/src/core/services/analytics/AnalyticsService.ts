/* eslint-disable @typescript-eslint/naming-convention */
import type { Transaction } from '@metamask/keyring-api';
import type { Json } from '@metamask/utils';

import type { SolanaKeyringAccount } from '../../../entities';
import type { Network, TransactionMetadata } from '../../constants/solana';
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
    await snap.request({
      method: 'snap_trackEvent',
      params: {
        event: {
          event,
          properties,
        },
      },
    });
  }

  async trackEventTransactionAdded(
    account: SolanaKeyringAccount,
    metadata: TransactionMetadata,
  ): Promise<void> {
    try {
      this.#logger.log('Tracking event transaction added');

      await this.#trackEvent('Transaction Added', {
        message: 'Snap transaction added',
        origin: metadata.origin,
        account_id: account.id,
        account_address: account.address,
        account_type: account.type,
        chain_id: metadata.scope,
      });
    } catch (error) {
      this.#logger.warn('Error tracking event transaction added', {
        error,
        metadata,
      });
    }
  }

  async trackEventTransactionApproved(
    account: SolanaKeyringAccount,
    metadata: TransactionMetadata,
  ): Promise<void> {
    try {
      this.#logger.log('Tracking event transaction approved');

      await this.#trackEvent('Transaction Approved', {
        message: 'Snap transaction approved',
        origin: metadata.origin,
        account_id: account.id,
        account_address: account.address,
        account_type: account.type,
        chain_id: metadata.scope,
      });
    } catch (error) {
      this.#logger.warn('Error tracking event transaction approved', {
        error,
        metadata,
      });
    }
  }

  async trackEventTransactionSubmitted(
    account: SolanaKeyringAccount,
    signature: string,
    metadata: TransactionMetadata,
  ): Promise<void> {
    try {
      this.#logger.log('Tracking event transaction submitted');

      await this.#trackEvent('Transaction Submitted', {
        message: 'Snap transaction submitted',
        origin: metadata.origin,
        account_id: account.id,
        account_address: account.address,
        account_type: account.type,
        chain_id: metadata.scope,
      });
    } catch (error) {
      this.#logger.warn('Error tracking event transaction submitted', {
        error,
        signature,
        metadata,
      });
    }
  }

  async trackEventTransactionFinalized(
    account: SolanaKeyringAccount,
    transaction: Transaction,
    metadata: TransactionMetadata,
  ): Promise<void> {
    try {
      this.#logger.log('Tracking event transaction finalized');

      await this.#trackEvent('Transaction Finalized', {
        message: 'Snap transaction finalized',
        origin: metadata.origin,
        account_id: account.id,
        account_address: account.address,
        account_type: account.type,
        chain_id: transaction.chain,
        transaction_status: transaction.status,
        transaction_type: transaction.type,
      });
    } catch (error) {
      this.#logger.warn('Error tracking event transaction finalized', {
        error,
        transaction,
        metadata,
      });
    }
  }

  async trackEventTransactionRejected(
    account: SolanaKeyringAccount,
    metadata: TransactionMetadata,
  ): Promise<void> {
    try {
      this.#logger.log('Tracking event transaction rejected');

      await this.#trackEvent('Transaction Rejected', {
        message: 'Snap transaction rejected',
        origin: metadata.origin,
        account_id: account.id,
        account_address: account.address,
        account_type: account.type,
        chain_id: metadata.scope,
      });
    } catch (error) {
      this.#logger.warn('Error tracking event transaction rejected', {
        error,
        metadata,
      });
    }
  }

  async trackEventSecurityAlertDetected(
    account: SolanaKeyringAccount,
    origin: string,
    scope: Network,
    securityAlertResponse: SecurityAlertResponse,
    securityAlertReason: string | null,
    securityAlertDescription: string,
  ): Promise<void> {
    try {
      this.#logger.log('Tracking event security alert detected');

      await this.#trackEvent('Security Alert Detected', {
        message: 'Snap security alert detected',
        origin,
        account_id: account.id,
        account_address: account.address,
        account_type: account.type,
        chain_id: scope,
        security_alert_response: securityAlertResponse,
        security_alert_reason: securityAlertReason,
        security_alert_description: securityAlertDescription,
      });
    } catch (error) {
      this.#logger.warn('Error tracking event security alert detected', {
        error,
        origin,
        scope,
        securityAlertResponse,
        securityAlertReason,
        securityAlertDescription,
      });
    }
  }

  async trackEventSecurityScanCompleted(
    account: SolanaKeyringAccount,
    origin: string,
    scope: Network,
    scanStatus: ScanStatus,
    hasSecurityAlerts: boolean,
  ): Promise<void> {
    try {
      this.#logger.log('Tracking event security scan completed');

      await this.#trackEvent('Security Scan Completed', {
        message: 'Snap security scan completed',
        origin,
        account_id: account.id,
        account_address: account.address,
        account_type: account.type,
        chain_id: scope,
        scan_status: scanStatus,
        has_security_alerts: hasSecurityAlerts,
      });
    } catch (error) {
      this.#logger.warn('Error tracking event security scan completed', {
        error,
        origin,
        scope,
        scanStatus,
        hasSecurityAlerts,
      });
    }
  }
}
