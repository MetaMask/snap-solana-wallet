import { handleKeyringRequest } from '@metamask/keyring-snap-sdk';
import type {
  Json,
  OnAssetsConversionHandler,
  OnAssetsLookupHandler,
  OnCronjobHandler,
  OnKeyringRequestHandler,
  OnProtocolRequestHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import {
  MethodNotFoundError,
  SnapError,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import { assert, enums } from '@metamask/superstruct';
import BigNumber from 'bignumber.js';

import { onAssetsConversion as onAssetsConversionHandler } from './core/handlers/onAssetsConversion/onAssetsConversion';
import { onAssetsLookup as onAssetsLookupHandler } from './core/handlers/onAssetsLookup/onAssetsLookup';
import { handlers as onCronjobHandlers } from './core/handlers/onCronjob';
import { ScheduleBackgroundEventMethod } from './core/handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import { CronjobMethod } from './core/handlers/onCronjob/cronjobs/CronjobMethod';
import { onProtocolRequest as onProtocolRequestHandler } from './core/handlers/onProtocolRequest/onProtocolRequest';
import { handlers as onRpcRequestHandlers } from './core/handlers/onRpcRequest';
import { RpcRequestMethod } from './core/handlers/onRpcRequest/types';
import { install as installPolyfills } from './core/polyfills';
import { isSnapRpcError } from './core/utils/errors';
import { getClientStatus, getInterfaceContext } from './core/utils/interface';
import logger from './core/utils/logger';
import { validateOrigin } from './core/validation/validators';
import { eventHandlers as confirmSignInEvents } from './features/confirmation/views/ConfirmSignIn/events';
import { eventHandlers as confirmSignMessageEvents } from './features/confirmation/views/ConfirmSignMessage/events';
import { eventHandlers as confirmSignAndSendTransactionEvents } from './features/confirmation/views/ConfirmTransactionRequest/events';
import { eventHandlers as sendFormEvents } from './features/send/views/SendForm/events';
import { eventHandlers as transactionConfirmationEvents } from './features/send/views/TransactionConfirmation/events';
import snapContext, { keyring } from './snapContext';

installPolyfills();

// Lowest precision we ever go for: MicroLamports represented in Sol amount
BigNumber.config({ EXPONENTIAL_AT: 16 });

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
    logger.log('[🔄 onRpcRequest]', request.method, request);

    const { method } = request;

    validateOrigin(origin, method);

    const handler = onRpcRequestHandlers[method as RpcRequestMethod];

    if (!handler) {
      throw new MethodNotFoundError(
        `RpcRequest method ${method} not found. Available methods: ${Object.values(
          RpcRequestMethod,
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
    logger.log('[🔑 onKeyringRequest]', request.method, request);

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
      `onKeyringRequest - ${request.method} - Error: ${JSON.stringify(
        snapError.toJSON(),
        null,
        2,
      )}`,
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
 * @returns A promise that resolves to a JSON object.
 * @throws If the request method is not valid for this snap.
 */
export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
  logger.log('[👇 onUserInput]', id, event);

  // Using the name of the component, route it to the correct handler
  if (!event.name) {
    return;
  }

  const uiEventHandlers: Record<string, (...args: any) => Promise<void>> = {
    ...sendFormEvents,
    ...transactionConfirmationEvents,
    ...confirmSignAndSendTransactionEvents,
    ...confirmSignMessageEvents,
    ...confirmSignInEvents,
  };

  const handler = uiEventHandlers[event.name];

  if (!handler) {
    return;
  }

  const context = await getInterfaceContext(id);

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
  logger.log('[⏱️ onCronjob]', request.method, request);

  const { method } = request;
  assert(
    method,
    enums([
      ...Object.values(CronjobMethod),
      ...Object.values(ScheduleBackgroundEventMethod),
    ]),
  );

  // Don't run cronjobs if client is locked
  // This assumes we don't want to run cronjobs while the client is locked
  const { locked } = await getClientStatus();
  if (locked) {
    return Promise.resolve();
  }

  const handler = onCronjobHandlers[method];

  return handler({ request });
};

export const onAssetsLookup: OnAssetsLookupHandler = onAssetsLookupHandler;

export const onAssetsConversion: OnAssetsConversionHandler =
  onAssetsConversionHandler;

export const onProtocolRequest: OnProtocolRequestHandler =
  onProtocolRequestHandler;
