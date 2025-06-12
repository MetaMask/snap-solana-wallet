/* eslint-disable @typescript-eslint/naming-convention */
import type { Transaction } from '@metamask/keyring-api';
import { assert } from '@metamask/superstruct';

import type { SolanaKeyringAccount } from '../../../entities';
import type { Network } from '../../constants/solana';
import logger from '../../utils/logger';
import { Base64Struct } from '../../validation/structs';

/**
 * Service for tracking events related to transactions.
 */
export class AnalyticsService {
  readonly #logger = logger;

  constructor(_logger = logger) {
    this.#logger = _logger;
  }

  async trackEventTransactionAdded(
    account: SolanaKeyringAccount,
    base64EncodedTransaction: string,
    scope: Network,
    origin?: string,
  ): Promise<void> {
    this.#logger.log(`[📣 AnalyticsService] Tracking event transaction added`);

    assert(base64EncodedTransaction, Base64Struct);

    await snap.request({
      method: 'snap_trackEvent',
      params: {
        event: {
          event: 'Transaction Added',
          properties: {
            message: 'Snap transaction added',
            origin: origin ?? null,
            account_id: account.id,
            account_address: account.address,
            account_type: account.type,
            chain_id: scope,
          },
        },
      },
    });
  }

  async trackEventTransactionApproved(
    account: SolanaKeyringAccount,
    base64EncodedTransaction: string,
    scope: Network,
    origin?: string,
  ): Promise<void> {
    this.#logger.log(
      `[📣 AnalyticsService] Tracking event transaction approved`,
    );

    assert(base64EncodedTransaction, Base64Struct);

    await snap.request({
      method: 'snap_trackEvent',
      params: {
        event: {
          event: 'Transaction Approved',
          properties: {
            message: 'Snap transaction approved',
            origin: origin ?? null,
            account_id: account.id,
            account_address: account.address,
            account_type: account.type,
            chain_id: scope,
          },
        },
      },
    });
  }

  async trackEventTransactionSubmitted(
    account: SolanaKeyringAccount,
    transactionMessageBase64Encoded: string,
    signature: string,
    scope: Network,
    origin?: string,
  ): Promise<void> {
    this.#logger.log(
      `[📣 AnalyticsService] Tracking event transaction submitted`,
    );

    assert(transactionMessageBase64Encoded, Base64Struct);

    await snap.request({
      method: 'snap_trackEvent',
      params: {
        event: {
          event: 'Transaction Submitted',
          properties: {
            message: 'Snap transaction submitted',
            origin: origin ?? null,
            account_id: account.id,
            account_address: account.address,
            account_type: account.type,
            chain_id: scope,
          },
        },
      },
    });
  }

  async trackEventTransactionFinalized(
    account: SolanaKeyringAccount,
    transaction: Transaction,
    origin?: string,
  ): Promise<void> {
    this.#logger.log(
      `[📣 AnalyticsService] Tracking event transaction finalized`,
    );

    await snap.request({
      method: 'snap_trackEvent',
      params: {
        event: {
          event: 'Transaction Finalized',
          properties: {
            message: 'Snap transaction finalized',
            origin: origin ?? null,
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
  }

  async trackEventTransactionRejected(
    account: SolanaKeyringAccount,
    base64EncodedTransaction: string,
    scope: Network,
    origin?: string,
  ): Promise<void> {
    this.#logger.log(
      `[📣 AnalyticsService] Tracking event transaction rejected`,
    );

    assert(base64EncodedTransaction, Base64Struct);

    await snap.request({
      method: 'snap_trackEvent',
      params: {
        event: {
          event: 'Transaction Rejected',
          properties: {
            message: 'Snap transaction rejected',
            origin: origin ?? null,
            account_id: account.id,
            account_address: account.address,
            account_type: account.type,
            chain_id: scope,
          },
        },
      },
    });
  }
}
