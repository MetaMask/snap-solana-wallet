import { SolMethod } from '@metamask/keyring-api';
import { assert, union } from '@metamask/superstruct';

import type { SolanaKeyringAccount } from '../../../entities';
import { render as renderConfirmSignIn } from '../../../features/confirmation/views/ConfirmSignIn/render';
import { render as renderConfirmSignMessage } from '../../../features/confirmation/views/ConfirmSignMessage/render';
import {
  DEFAULT_CONFIRMATION_CONTEXT,
  render as renderConfirmTransactionRequest,
} from '../../../features/confirmation/views/ConfirmTransactionRequest/render';
import { ScheduleBackgroundEventMethod } from '../../handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import type { SolanaKeyringRequest } from '../../handlers/onKeyringRequest/structs';
import {
  SolanaSignAndSendTransactionRequestStruct,
  SolanaSignTransactionRequestStruct,
} from '../wallet/structs';

/**
 * Wraps the confirmation logic for the keyring API.
 *
 * It is responsible for rendering the confirmation UI and handling the side effects that need to happen when the transaction is shown in confirmation UI.
 */
export class ConfirmationHandler {
  /**
   * Handles the confirmation of a request, based on the method of the request.
   * Renders the appropriate confirmation UI for the request, and returns whether the request was confirmed.
   *
   * @param request - The request to confirm.
   * @param account - The account that the request is for.
   * @returns Whether the request was confirmed.
   */
  async handleKeyringRequest(
    request: SolanaKeyringRequest,
    account: SolanaKeyringAccount,
  ): Promise<boolean> {
    const {
      request: { method },
    } = request;

    switch (method) {
      case SolMethod.SignAndSendTransaction:
        return this.#handleConfirmTransactionRequest(request, account);
      case SolMethod.SignTransaction:
        return this.#handleConfirmTransactionRequest(request, account);
      case SolMethod.SignMessage:
        return this.#handleConfirmSignMessage(request, account);
      case SolMethod.SignIn:
        return this.#handleConfirmSignIn(request, account);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Handles the confirmation whenever a transaction needs to be signed:
   * - Sign and send transaction request.
   * - Sign transaction request.
   *
   * @param request - The request to confirm.
   * @param account - The account that the request is for.
   * @returns Whether the request was confirmed.
   */
  async #handleConfirmTransactionRequest(
    request: SolanaKeyringRequest,
    account: SolanaKeyringAccount,
  ): Promise<boolean> {
    assert(
      request.request,
      union([
        SolanaSignAndSendTransactionRequestStruct,
        SolanaSignTransactionRequestStruct,
      ]),
    );

    const {
      request: {
        method,
        params: { transaction: base64EncodedTransaction },
      },
      scope,
      account: accountId,
      origin,
    } = request;

    // Trigger the side effects that need to happen when the transaction is shown in confirmation UI
    await snap.request({
      method: 'snap_scheduleBackgroundEvent',
      params: {
        duration: 'PT1S',
        request: {
          method: ScheduleBackgroundEventMethod.OnTransactionAdded,
          params: {
            accountId,
            base64EncodedTransaction,
            scope,
            origin,
          },
        },
      },
    });

    const isConfirmed = await renderConfirmTransactionRequest({
      ...DEFAULT_CONFIRMATION_CONTEXT,
      scope,
      method,
      origin: request.origin,
      transaction: base64EncodedTransaction,
      account,
    });

    if (isConfirmed) {
      // Trigger the side effects that need to happen when the transaction is approved
      await snap.request({
        method: 'snap_scheduleBackgroundEvent',
        params: {
          duration: 'PT1S',
          request: {
            method: ScheduleBackgroundEventMethod.OnTransactionApproved,
            params: {
              accountId,
              base64EncodedTransaction,
              scope,
              origin,
            },
          },
        },
      });

      return true;
    }

    // Trigger the side effects that need to happen when the transaction is rejected
    await snap.request({
      method: 'snap_scheduleBackgroundEvent',
      params: {
        duration: 'PT1S',
        request: {
          method: ScheduleBackgroundEventMethod.OnTransactionRejected,
          params: {
            accountId,
            base64EncodedTransaction,
            scope,
            origin,
          },
        },
      },
    });

    return false;
  }

  /**
   * Handles the confirmation of a sign message request.
   *
   * @param request - The request to confirm.
   * @param account - The account that the request is for.
   * @returns Whether the request was confirmed.
   */
  async #handleConfirmSignMessage(
    request: SolanaKeyringRequest,
    account: SolanaKeyringAccount,
  ): Promise<boolean> {
    const isConfirmed = await renderConfirmSignMessage(request, account);
    return Boolean(isConfirmed);
  }

  /**
   * Handles the confirmation of a sign in request.
   *
   * @param request - The request to confirm.
   * @param account - The account that the request is for.
   * @returns Whether the request was confirmed.
   */
  async #handleConfirmSignIn(
    request: SolanaKeyringRequest,
    account: SolanaKeyringAccount,
  ): Promise<boolean> {
    const isConfirmed = await renderConfirmSignIn(request, account);
    return Boolean(isConfirmed);
  }
}
