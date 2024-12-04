import { handleKeyringRequest } from '@metamask/keyring-api';
import type {
  Json,
  OnCronjobHandler,
  OnKeyringRequestHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import {
  MethodNotFoundError,
  SnapError,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';

import { SolanaInternalRpcMethods } from './core/constants/solana';
import { handlers, OnCronjobMethods } from './core/handlers/onCronjob';
import { install as installPolyfills } from './core/polyfills';
import { keyring } from './core/services';
import { isSnapRpcError } from './core/utils/errors';
import logger from './core/utils/logger';
import { validateOrigin } from './core/validation/validators';
import { handleSendEvents, isSendFormEvent } from './features/send/events';
import { renderSend } from './features/send/render';
import type {
  SendContext,
  StartSendTransactionFlowParams,
} from './features/send/types/send';
import {
  type TransactionConfirmationContext,
  type TransactionConfirmationParams,
} from './features/transaction-confirmation/components/TransactionConfirmation/types';
import {
  handleTransactionConfirmationEvents,
  isTransactionConfirmationEvent,
} from './features/transaction-confirmation/events';
import { renderTransactionConfirmation } from './features/transaction-confirmation/render';

installPolyfills();

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns A promise that resolves to the result of the RPC request.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  try {
    const { method } = request;

    validateOrigin(origin, method);

    switch (method) {
      case SolanaInternalRpcMethods.StartSendTransactionFlow:
        return await renderSend(
          request.params as StartSendTransactionFlowParams,
        );
      case SolanaInternalRpcMethods.ShowTransactionConfirmation:
        return await renderTransactionConfirmation(
          request.params as TransactionConfirmationParams,
        );
      default:
        throw new MethodNotFoundError() as unknown as Error;
    }
  } catch (error: any) {
    let snapError = error;

    if (!isSnapRpcError(error)) {
      snapError = new SnapError(error);
    }
    logger.error(
      `onRpcRequest error: ${JSON.stringify(snapError.toJSON(), null, 2)}`,
    );
    throw snapError;
  }
};

/**
 * Handle incoming keyring requests.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated keyring request object.
 * @returns A promise that resolves to a JSON object.
 * @throws If the request method is not valid for this snap.
 */
export const onKeyringRequest: OnKeyringRequestHandler = async ({
  origin,
  request,
}): Promise<Json> => {
  try {
    validateOrigin(origin, request.method);

    return (await handleKeyringRequest(
      keyring,
      request,
    )) as unknown as Promise<Json>;
  } catch (error: any) {
    let snapError = error;

    if (!isSnapRpcError(error)) {
      snapError = new SnapError(error);
    }

    logger.error(
      `onKeyringRequest error: ${JSON.stringify(snapError.toJSON(), null, 2)}`,
    );

    throw snapError;
  }
};

/**
 * Handle user events requests.
 *
 * @param args - The request handler args as object.
 * @param args.id - The interface id associated with the event.
 * @param args.event - The event object.
 * @param args.context - The context object.
 * @returns A promise that resolves to a JSON object.
 * @throws If the request method is not valid for this snap.
 */
export const onUserInput: OnUserInputHandler = async ({
  id,
  event,
  context,
}) => {
  if (isSendFormEvent(event)) {
    await handleSendEvents({ id, event, context: context as SendContext });
  }
  if (isTransactionConfirmationEvent(event)) {
    await handleTransactionConfirmationEvents({
      id,
      event,
      context: context as TransactionConfirmationContext,
    });
  }
};

/**
 * Handle incoming cronjob requests.
 *
 * @param args - The request handler args as object.
 * @param args.request - A validated cronjob request object.
 * @returns A promise that resolves to a JSON object.
 * @throws If the request method is not valid for this snap.
 * @see https://docs.metamask.io/snaps/reference/entry-points/#oncronjob
 */
export const onCronjob: OnCronjobHandler = async ({ request }) => {
  const { method } = request;

  const handler = handlers[method as OnCronjobMethods];

  if (!handler) {
    throw new MethodNotFoundError(
      `Cronjob method ${method} not found. Available methods: ${Object.values(
        OnCronjobMethods,
      ).toString()}`,
    ) as unknown as Error;
  }

  return handler({ request });
};
