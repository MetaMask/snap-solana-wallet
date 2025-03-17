import { SolMethod } from '@metamask/keyring-api';
import { assert } from '@metamask/superstruct';

import {
  DEFAULT_CONFIRMATION_CONTEXT,
  renderConfirmSignAndSendTransaction,
  renderConfirmSignMessage,
} from '../../../features/confirmation/render';
import { ScheduleBackgroundEventMethod } from '../../handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import type { SolanaKeyringRequest } from '../../handlers/onKeyringRequest/structs';
import {
  SolanaSignAndSendTransactionRequestStruct,
  SolanaSignInRequestStruct,
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
        return this.#handleSignAndSendTransaction(request, account);
      case SolMethod.SignTransaction:
        return this.#handleSignTransaction(request, account);
      case SolMethod.SignMessage:
        return this.#handleSignMessage(request, account);
      case SolMethod.SignIn:
        return this.#handleSignIn(request, account);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Handles the confirmation of a sign and send transaction request.
   *
   * @param request - The request to confirm.
   * @param account - The account that the request is for.
   * @returns Whether the request was confirmed.
   */
  async #handleSignAndSendTransaction(
    request: SolanaKeyringRequest,
    account: SolanaKeyringAccount,
  ): Promise<boolean> {
    assert(request.request, SolanaSignAndSendTransactionRequestStruct);

    const {
      request: { method, params },
      scope,
      account: accountId,
    } = request;
    const base64EncodedTransaction = (params as any).transaction ?? '';

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
          },
        },
      },
    });

    const isConfirmed = await renderConfirmSignAndSendTransaction({
      ...DEFAULT_CONFIRMATION_CONTEXT,
      scope,
      method,
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
          },
        },
      },
    });

    return false;
  }

  /**
   * Handles the confirmation of a sign transaction request.
   *
   * @param request - The request to confirm.
   * @param account - The account that the request is for.
   * @returns Whether the request was confirmed.
   */
  async #handleSignTransaction(
    request: SolanaKeyringRequest,
    account: SolanaKeyringAccount,
  ): Promise<boolean> {
    assert(request.request, SolanaSignTransactionRequestStruct);

    return true;
  }

  /**
   * Handles the confirmation of a sign message request.
   *
   * @param request - The request to confirm.
   * @param account - The account that the request is for.
   * @returns Whether the request was confirmed.
   */
  async #handleSignMessage(
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
  async #handleSignIn(
    request: SolanaKeyringRequest,
    account: SolanaKeyringAccount,
  ): Promise<boolean> {
    assert(request.request, SolanaSignInRequestStruct);

    return true;
  }
}
