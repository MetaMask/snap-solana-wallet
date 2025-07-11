/* eslint-disable @typescript-eslint/naming-convention */
import type { Transaction } from '@metamask/keyring-api';
import { assert } from '@metamask/superstruct';

import type { SolanaKeyringAccount } from '../../../entities';
import type { Network, TransactionMetadata } from '../../constants/solana';
import logger from '../../utils/logger';
import { Base64Struct } from '../../validation/structs';
import type {
  ScanStatus,
  SecurityAlertResponse,
} from '../transaction-scan/types';

/**
 * Service for tracking events related to transactions.
 */
export class AnalyticsService {
  readonly #logger = logger;

  readonly #loggerPrefix = '[📣 AnalyticsService]';

  constructor(_logger = logger) {
    this.#logger = _logger;
  }

  async trackEventTransactionAdded(
    account: SolanaKeyringAccount,
    base64EncodedTransaction: string,
    metadata: TransactionMetadata,
  ): Promise<void> {
    try {
      this.#logger.log(this.#loggerPrefix, 'Tracking event transaction added');

      assert(base64EncodedTransaction, Base64Struct);

      await snap.request({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Added',
            properties: {
              message: 'Snap transaction added',
              origin: metadata.origin,
              account_id: account.id,
              account_address: account.address,
              account_type: account.type,
              chain_id: metadata.scope,
            },
          },
        },
      });
    } catch (error) {
      this.#logger.warn(
        this.#loggerPrefix,
        'Error tracking event transaction added',
        {
          error,
          base64EncodedTransaction,
          metadata,
        },
      );
    }
  }

  async trackEventTransactionApproved(
    account: SolanaKeyringAccount,
    base64EncodedTransaction: string,
    metadata: TransactionMetadata,
  ): Promise<void> {
    try {
      this.#logger.log(
        this.#loggerPrefix,
        'Tracking event transaction approved',
      );

      assert(base64EncodedTransaction, Base64Struct);

      await snap.request({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Approved',
            properties: {
              message: 'Snap transaction approved',
              origin: metadata.origin,
              account_id: account.id,
              account_address: account.address,
              account_type: account.type,
              chain_id: metadata.scope,
            },
          },
        },
      });
    } catch (error) {
      this.#logger.warn(
        this.#loggerPrefix,
        'Error tracking event transaction approved',
        {
          error,
          base64EncodedTransaction,
          metadata,
        },
      );
    }
  }

  async trackEventTransactionSubmitted(
    account: SolanaKeyringAccount,
    transactionMessageBase64Encoded: string,
    signature: string,
    metadata: TransactionMetadata,
  ): Promise<void> {
    try {
      this.#logger.log(
        this.#loggerPrefix,
        'Tracking event transaction submitted',
      );

      assert(transactionMessageBase64Encoded, Base64Struct);

      await snap.request({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Submitted',
            properties: {
              message: 'Snap transaction submitted',
              origin: metadata.origin,
              account_id: account.id,
              account_address: account.address,
              account_type: account.type,
              chain_id: metadata.scope,
            },
          },
        },
      });
    } catch (error) {
      this.#logger.warn(
        this.#loggerPrefix,
        'Error tracking event transaction submitted',
        {
          error,
          transactionMessageBase64Encoded,
          signature,
          metadata,
        },
      );
    }
  }

  async trackEventTransactionFinalized(
    account: SolanaKeyringAccount,
    transaction: Transaction,
    metadata: TransactionMetadata,
  ): Promise<void> {
    try {
      this.#logger.log(
        this.#loggerPrefix,
        'Tracking event transaction finalized',
      );

      await snap.request({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Finalized',
            properties: {
              message: 'Snap transaction finalized',
              origin: metadata.origin,
              account_id: account.id,
              account_address: account.address,
              account_type: account.type,
              chain_id: transaction.chain,
              transaction_status: transaction.status,
              transaction_type: transaction.type,
            },
          },
        },
      });
    } catch (error) {
      this.#logger.warn(
        this.#loggerPrefix,
        'Error tracking event transaction finalized',
        {
          error,
          transaction,
          metadata,
        },
      );
    }
  }

  async trackEventTransactionRejected(
    account: SolanaKeyringAccount,
    base64EncodedTransaction: string,
    metadata: TransactionMetadata,
  ): Promise<void> {
    try {
      this.#logger.log(
        this.#loggerPrefix,
        'Tracking event transaction rejected',
      );

      assert(base64EncodedTransaction, Base64Struct);

      await snap.request({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Rejected',
            properties: {
              message: 'Snap transaction rejected',
              origin: metadata.origin,
              account_id: account.id,
              account_address: account.address,
              account_type: account.type,
              chain_id: metadata.scope,
            },
          },
        },
      });
    } catch (error) {
      this.#logger.warn(
        this.#loggerPrefix,
        'Error tracking event transaction rejected',
        {
          error,
          base64EncodedTransaction,
          metadata,
        },
      );
    }
  }

  async trackEventSecurityAlertDetected(
    account: SolanaKeyringAccount,
    base64EncodedTransaction: string,
    origin: string,
    scope: Network,
    securityAlertResponse: SecurityAlertResponse,
    securityAlertReason: string | null,
    securityAlertDescription: string,
  ): Promise<void> {
    try {
      this.#logger.log(
        this.#loggerPrefix,
        'Tracking event security alert detected',
      );

      assert(base64EncodedTransaction, Base64Struct);

      await snap.request({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Security Alert Detected',
            properties: {
              message: 'Snap security alert detected',
              origin,
              account_id: account.id,
              account_address: account.address,
              account_type: account.type,
              chain_id: scope,
              security_alert_response: securityAlertResponse,
              security_alert_reason: securityAlertReason,
              security_alert_description: securityAlertDescription,
            },
          },
        },
      });
    } catch (error) {
      this.#logger.warn(
        this.#loggerPrefix,
        'Error tracking event security alert detected',
        {
          error,
          base64EncodedTransaction,
          origin,
          scope,
          securityAlertResponse,
          securityAlertReason,
          securityAlertDescription,
        },
      );
    }
  }

  async trackEventSecurityScanCompleted(
    account: SolanaKeyringAccount,
    base64EncodedTransaction: string,
    origin: string,
    scope: Network,
    scanStatus: ScanStatus,
    hasSecurityAlerts: boolean,
  ): Promise<void> {
    try {
      this.#logger.log(
        this.#loggerPrefix,
        'Tracking event security scan completed',
      );

      assert(base64EncodedTransaction, Base64Struct);

      await snap.request({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Security Scan Completed',
            properties: {
              message: 'Snap security scan completed',
              origin,
              account_id: account.id,
              account_address: account.address,
              account_type: account.type,
              chain_id: scope,
              scan_status: scanStatus,
              has_security_alerts: hasSecurityAlerts,
            },
          },
        },
      });
    } catch (error) {
      this.#logger.warn(
        this.#loggerPrefix,
        'Error tracking event security scan completed',
        {
          error,
          base64EncodedTransaction,
          origin,
          scope,
          scanStatus,
          hasSecurityAlerts,
        },
      );
    }
  }
}
