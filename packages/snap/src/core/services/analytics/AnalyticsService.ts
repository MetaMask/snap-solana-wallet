import type { Transaction } from '@metamask/keyring-api';
import { assert } from '@metamask/superstruct';

import type { Network } from '../../constants/solana';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
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
  ): Promise<void> {
    this.#logger.log(`[📣 AnalyticsService] Tracking event transaction added`);

    assert(base64EncodedTransaction, Base64Struct);
    // TODO: Implement
  }

  async trackEventTransactionApproved(
    account: SolanaKeyringAccount,
    base64EncodedTransaction: string,
    scope: Network,
  ): Promise<void> {
    this.#logger.log(
      `[📣 AnalyticsService] Tracking event transaction approved`,
    );

    assert(base64EncodedTransaction, Base64Struct);
    // TODO: Implement
    // TODO: Implement
  }

  async trackEventTransactionSubmitted(
    account: SolanaKeyringAccount,
    base64EncodedTransaction: string,
    signature: string,
    scope: Network,
  ): Promise<void> {
    this.#logger.log(
      `[📣 AnalyticsService] Tracking event transaction submitted`,
    );

    assert(base64EncodedTransaction, Base64Struct);
    // TODO: Implement
    // TODO: Implement
  }

  async trackEventTransactionFinalized(
    account: SolanaKeyringAccount,
    transaction: Transaction,
  ): Promise<void> {
    this.#logger.log(
      `[📣 AnalyticsService] Tracking event transaction finalized`,
    );
    // TODO: Implement
  }

  async trackEventTransactionRejected(
    account: SolanaKeyringAccount,
    base64EncodedTransaction: string,
    scope: Network,
  ): Promise<void> {
    this.#logger.log(
      `[📣 AnalyticsService] Tracking event transaction rejected`,
    );

    assert(base64EncodedTransaction, Base64Struct);
    // TODO: Implement
    // TODO: Implement
  }
}
