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

import {
  handlers as onCronjobHandlers,
  OnCronjobMethods,
} from './core/handlers/onCronjob';
import {
  handlers as onRpcRequestHandlers,
  OnRpcRequestMethods,
} from './core/handlers/onRpcRequest';
import { install as installPolyfills } from './core/polyfills';
import { isSnapRpcError } from './core/utils/errors';
import logger from './core/utils/logger';
import { validateOrigin } from './core/validation/validators';
import { eventHandlers as sendFormEvents } from './features/send/views/SendForm/events';
import { eventHandlers as transactionConfirmationEvents } from './features/send/views/TransactionConfirmation/events';
import snapContext, { keyring } from './snap-context';

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

    const handler = onRpcRequestHandlers[method as OnRpcRequestMethods];

    if (!handler) {
      throw new MethodNotFoundError(
        `RpcRequest method ${method} not found. Available methods: ${Object.values(
          OnRpcRequestMethods,
        ).toString()}`,
      ) as unknown as Error;
    }

    return handler({ origin, request });
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
  /**
   * Using the name of the component, route it to the correct handler
   */
  if (!event.name) {
    return;
  }

  const uiEventHandlers: Record<string, (...args: any) => Promise<void>> = {
    ...sendFormEvents,
    ...transactionConfirmationEvents,
  };

  const handler = uiEventHandlers[event.name];

  if (!handler) {
    return;
  }

  await handler({ id, event, context, snapContext });
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

  const handler = onCronjobHandlers[method as OnCronjobMethods];

  if (!handler) {
    throw new MethodNotFoundError(
      `Cronjob method ${method} not found. Available methods: ${Object.values(
        OnCronjobMethods,
      ).toString()}`,
    ) as unknown as Error;
  }

  return handler({ request });
};
